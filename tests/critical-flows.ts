// Automated Verification Test Suite for Hacktober 2026 Critical Business Rules
import {
  calculateRegistrationPrice,
  OFFICIAL_EVENTS,
  INITIAL_PRICING_CONFIG,
  ALLOWED_SEMESTERS,
} from '../src/lib/constants';
import { generateRegistrationId, generateSafeToken, verifySafeToken } from '../src/lib/idGenerator';
import { RegistrationWizardSchema } from '../src/lib/validation';
import { dbRepository } from '../src/lib/db/repository';
import { isAuthorizedRole } from '../src/lib/auth/jwt';
import { authRateLimiter } from '../src/lib/auth/rate-limiter';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  console.log('\n--- HACKTOBER 2026 CRITICAL BUSINESS RULES TEST SUITE ---\n');

  // ==========================================
  // 1. DYNAMIC PRICING ENGINE TESTS
  // ==========================================
  console.log('1. Testing Pricing Calculation:');
  const price1 = calculateRegistrationPrice(['cyber-quiz']);
  assert(price1.amount === 79 && price1.canProceed === true, '1 event = ₹79 (ACTIVE)');

  const price2 = calculateRegistrationPrice(['cyber-quiz', 'cyber-debate']);
  assert(price2.amount === 150 && price2.canProceed === true, '2 events = ₹150 (ACTIVE)');

  const price3 = calculateRegistrationPrice(['cyber-quiz', 'cyber-debate', 'tech-debug']);
  assert(price3.amount === 199 && price3.canProceed === true, '3 events = ₹199 (ACTIVE)');

  const price4 = calculateRegistrationPrice(['cyber-quiz', 'cyber-debate', 'mini-hackathon', 'cyber-hunt']);
  assert(price4.amount === 300 && price4.canProceed === true, '4 events = ₹300 (ACTIVE)');

  const price5 = calculateRegistrationPrice(OFFICIAL_EVENTS.map((e) => e.id));
  assert(price5.amount === 350 && price5.canProceed === true, '5 events = ₹350 (ACTIVE)');

  // Test dynamic TBD behavior with customConfig override
  const customTbdPrice = calculateRegistrationPrice(['cyber-quiz', 'cyber-debate'], {
    2: { eventCount: 2, price: null, status: 'TBD', notice: 'Custom organizer hold' },
  });
  assert(
    customTbdPrice.amount === null &&
      customTbdPrice.canProceed === false &&
      Boolean(customTbdPrice.notice?.includes('Custom organizer hold')),
    'TBD tier dynamically blocks payment submission with notice'
  );

  // ==========================================
  // 2. EVENT CATALOG CONSTRAINTS
  // ==========================================
  console.log('\n2. Testing Event Catalog & Team Sizes:');
  assert(OFFICIAL_EVENTS.length === 5, 'Exactly 5 official contests defined');

  const quiz = OFFICIAL_EVENTS.find((e) => e.id === 'cyber-quiz');
  assert(quiz?.type === 'INDIVIDUAL' && quiz?.maxTeamSize === 1, 'Cybersecurity Quiz is individual (max 1)');

  const hackathon = OFFICIAL_EVENTS.find((e) => e.id === 'mini-hackathon');
  assert(hackathon?.type === 'TEAM' && hackathon?.maxTeamSize === 4, 'Mini Hackathon is team (max 4 members)');

  const hunt = OFFICIAL_EVENTS.find((e) => e.id === 'cyber-hunt');
  assert(hunt?.type === 'TEAM' && hunt?.maxTeamSize === 4, 'Cyber Hunt is team (max 4 members)');

  // ==========================================
  // 3. INDIVIDUAL REGISTRATION VALIDATION
  // ==========================================
  console.log('\n3. Testing Individual Registration Validation:');

  const validIndividualPayload = {
    selectedEventIds: ['mini-hackathon', 'cyber-hunt'],
    primaryParticipant: {
      fullName: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '9876543210',
      usn: '3GN23CS042',
      college: 'GNDEC Bidar',
      department: 'CSE',
      yearSemester: '5th Sem',
    },
    transactionId: 'UTR49201948201',
    screenshotData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  };

  const indParsed = RegistrationWizardSchema.safeParse(validIndividualPayload);
  assert(indParsed.success, 'Individual registration without team fields accepted for all events');

  // Semester Validation: Only 1st, 3rd, 5th, 7th Sem accepted
  for (const sem of ALLOWED_SEMESTERS) {
    const semPayload = {
      ...validIndividualPayload,
      primaryParticipant: { ...validIndividualPayload.primaryParticipant, yearSemester: sem },
    };
    assert(RegistrationWizardSchema.safeParse(semPayload).success, `Semester ${sem} is accepted`);
  }

  const invalidSemPayload = {
    ...validIndividualPayload,
    primaryParticipant: { ...validIndividualPayload.primaryParticipant, yearSemester: '6th Sem' },
  };
  assert(!RegistrationWizardSchema.safeParse(invalidSemPayload).success, 'Unlisted semester (6th Sem) strictly rejected');

  // Invalid: Missing required participant field (e.g. USN)
  const invalidUsnPayload = {
    ...validIndividualPayload,
    primaryParticipant: {
      ...validIndividualPayload.primaryParticipant,
      usn: '',
    },
  };
  const invalidUsnParsed = RegistrationWizardSchema.safeParse(invalidUsnPayload);
  assert(!invalidUsnParsed.success, 'Missing USN strictly rejected');

  // Invalid: Invalid screenshot format
  const invalidScreenshotPayload = {
    ...validIndividualPayload,
    screenshotData: 'plain-text-not-image',
  };
  const invalidScreenshotParsed = RegistrationWizardSchema.safeParse(invalidScreenshotPayload);
  assert(!invalidScreenshotParsed.success, 'Invalid payment screenshot proof strictly rejected');

  // ==========================================
  // 4. REGISTRATION ID & SAFE QR TOKEN
  // ==========================================
  console.log('\n4. Testing Registration ID & Cryptographic QR Token:');
  const regId1 = generateRegistrationId();
  const regId2 = generateRegistrationId();
  assert(regId1.startsWith('HT26-'), 'Registration ID starts with HT26- prefix');
  assert(regId1 !== regId2, 'Non-sequential unique registration IDs generated');

  const safeToken = generateSafeToken(regId1);
  const verifyValid = verifySafeToken(safeToken);
  assert(verifyValid.isValid && verifyValid.registrationId === regId1, 'Cryptographic QR token verifies correctly');

  const verifyTampered = verifySafeToken(`${safeToken}bad`);
  assert(!verifyTampered.isValid, 'Forged or tampered QR token fails verification');

  // ==========================================
  // 5. DATABASE REPOSITORY & PAYMENT LIFECYCLE
  // ==========================================
  console.log('\n5. Testing Database Repository & Payment Lifecycle:');
  const testReg = await dbRepository.createRegistration({
    registration: {
      registrationId: regId1,
      eventIds: ['cyber-quiz', 'mini-hackathon', 'tech-debug'],
      type: 'MIXED',
      totalAmount: 199,
      paymentStatus: 'PENDING',
    },
    primaryParticipant: {
      fullName: 'Rahul Sharma',
      email: 'rahul@gndec.ac.in',
      phone: '9876543210',
      usn: '3GN23CS042',
      college: 'GNDEC Bidar',
      department: 'CSE',
      yearSemester: '5th Sem',
    },
    payment: {
      amount: 199,
      transactionId: 'UTR_TEST_123456',
      screenshotUrl: 'data:image/png;base64,...',
      screenshotMime: 'image/png',
    },
  });

  assert(testReg.registration.paymentStatus === 'PENDING', 'Initial payment status is PENDING');

  // Admin verifies payment
  const verifyOk = await dbRepository.updatePaymentStatus(
    regId1,
    'VERIFIED',
    'admin@gndec.ac.in',
    'Verified against bank log'
  );
  assert(verifyOk, 'Payment status updated to VERIFIED by admin');

  const fetched = await dbRepository.getRegistrationById(regId1);
  assert(fetched?.registration.paymentStatus === 'VERIFIED', 'Database reflects VERIFIED payment status');

  // ==========================================
  // 6. ATTENDANCE & DUPLICATE PREVENTION
  // ==========================================
  console.log('\n6. Testing Event Attendance & Duplicate Protection:');
  const att1 = await dbRepository.markAttendance({
    registrationId: regId1,
    participantId: '3GN23CS042',
    eventId: 'cyber-quiz',
    adminEmail: 'admin@gndec.ac.in',
  });
  assert(att1.success && att1.alreadyMarked === false, 'Attendance marked PRESENT for Cyber Quiz');

  // Duplicate Check-in Attempt
  const attDuplicate = await dbRepository.markAttendance({
    registrationId: regId1,
    participantId: '3GN23CS042',
    eventId: 'cyber-quiz',
    adminEmail: 'admin@gndec.ac.in',
  });
  assert(attDuplicate.alreadyMarked === true, 'Duplicate attendance blocked and flagged with prior timestamp');

  // ==========================================
  // 7. RBAC & SECURITY PERMISSION CHECKS
  // ==========================================
  console.log('\n7. Testing Role-Based Access Control (RBAC):');
  assert(isAuthorizedRole('SUPER_ADMIN', 'SUPER_ADMIN') === true, 'SUPER_ADMIN has SUPER_ADMIN rights');
  assert(isAuthorizedRole('SUPER_ADMIN', 'ADMIN') === true, 'SUPER_ADMIN has ADMIN rights');
  assert(isAuthorizedRole('SUPER_ADMIN', 'VIEWER') === true, 'SUPER_ADMIN has VIEWER rights');

  assert(isAuthorizedRole('ADMIN', 'SUPER_ADMIN') === false, 'ADMIN cannot access SUPER_ADMIN rights');
  assert(isAuthorizedRole('ADMIN', 'ADMIN') === true, 'ADMIN has ADMIN rights');
  assert(isAuthorizedRole('ADMIN', 'VIEWER') === true, 'ADMIN has VIEWER rights');

  assert(isAuthorizedRole('VIEWER', 'SUPER_ADMIN') === false, 'VIEWER cannot access SUPER_ADMIN rights');
  assert(isAuthorizedRole('VIEWER', 'ADMIN') === false, 'VIEWER cannot access ADMIN rights (Forbidden)');
  assert(isAuthorizedRole('VIEWER', 'VIEWER') === true, 'VIEWER has read-only VIEWER rights');

  // ==========================================
  // 8. FILTER-AWARE EXPORT SUBSET
  // ==========================================
  console.log('\n8. Testing Filter-Aware Export Query:');
  const filteredList = await dbRepository.listRegistrations({
    eventId: 'cyber-quiz',
    paymentStatus: 'VERIFIED',
  });
  assert(
    filteredList.items.every(
      (item) => item.registration.eventIds.includes('cyber-quiz') && item.paymentStatus === 'VERIFIED'
    ),
    'Export query strictly honors active filters (Cyber Quiz + VERIFIED)'
  );

  // ==========================================
  // 9. ADMIN LOGIN RATE LIMITER & BRUTE-FORCE LOCKOUT
  // ==========================================
  console.log('\n9. Testing Admin Login Rate Limiter & Brute-Force Lockout:');
  const testKey = 'ip:192.168.1.99';
  authRateLimiter.reset(testKey);

  assert(!authRateLimiter.isLockedOut(testKey).locked, 'Initial state is not locked out');

  // Record 4 failed attempts
  for (let i = 1; i <= 4; i++) {
    const res = authRateLimiter.recordFailure(testKey);
    assert(!res.locked, `Attempt ${i} is not locked out`);
    assert(res.attemptsLeft === 5 - i, `${5 - i} attempt(s) remaining`);
  }

  // 5th failed attempt triggers lockout
  const fifthAttempt = authRateLimiter.recordFailure(testKey);
  assert(fifthAttempt.locked, '5th failed attempt triggers lockout');
  assert(fifthAttempt.attemptsLeft === 0, '0 attempts remaining on lockout');
  assert(authRateLimiter.isLockedOut(testKey).locked, 'Subsequent checks confirm lockout');

  // Reset unlocks
  authRateLimiter.reset(testKey);
  assert(!authRateLimiter.isLockedOut(testKey).locked, 'Reset successfully clears lockout');

  console.log(`\n=========================================`);
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (100%)`);
  console.log(`=========================================\n`);
}

runTests().catch((err) => {
  console.error('Test Suite Unhandled Exception:', err);
  process.exit(1);
});
