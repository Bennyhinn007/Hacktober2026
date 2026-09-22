import assert from 'node:assert';

async function runE2EServerTests() {
  console.log('=== STARTING FULL-STACK HTTP E2E VERIFICATION ===\n');
  const baseUrl = 'http://localhost:3000';

  // 1. Test Public Routes
  console.log('1. Testing Public Routes:');
  const routes = ['/', '/events', '/schedule', '/rules', '/register', '/admin/login'];
  for (const r of routes) {
    const res = await fetch(`${baseUrl}${r}`);
    assert.strictEqual(res.status, 200, `Route ${r} should return 200 OK`);
    const text = await res.text();
    assert(text.includes('HACKTOBER 2026') || text.includes('Hacktober 2026'), `${r} should contain Hacktober 2026 title`);
    console.log(`  ✓ Route ${r} loads successfully (HTTP 200)`);
  }

  // 2. Test Admin Authentication & Cookie Session
  console.log('\n2. Testing Admin Authentication:');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@gndec.ac.in',
      password: 'Admin@Hacktober2026',
    }),
  });
  assert.strictEqual(loginRes.status, 200, 'Admin login should succeed');
  const loginData = await loginRes.json();
  assert.strictEqual(loginData.user.role, 'SUPER_ADMIN', 'Logged in user should be SUPER_ADMIN');
  console.log(`  ✓ Authenticated as: ${loginData.user.fullName} (${loginData.user.role})`);

  // Extract set-cookie
  const setCookie = loginRes.headers.get('set-cookie');
  assert(setCookie && setCookie.includes('ht26_admin_token'), 'Session cookie ht26_admin_token should be set');
  const cookieHeader = setCookie.split(';')[0];
  console.log('  ✓ HttpOnly JWT cookie acquired');

  // 3. Test Admin Dashboard API
  console.log('\n3. Testing Admin Dashboard Metrics:');
  // 3. Test Admin Dashboard API
  console.log('\n3. Testing Admin Dashboard Metrics:');
  const dashRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Cookie: cookieHeader },
  });
  const dashData = await dashRes.json();
  assert.strictEqual(dashRes.status, 200, 'Dashboard API should return 200');
  assert(dashData.data && typeof dashData.data.totalRegistrations === 'number', 'Dashboard should return totalRegistrations');
  assert(typeof dashData.data.totalRevenue === 'number', 'Dashboard should return totalRevenue');
  console.log(`  ✓ Total Registrations in DB: ${dashData.data.totalRegistrations}`);
  console.log(`  ✓ Total Revenue: ₹${dashData.data.totalRevenue}`);
  console.log(`  ✓ Total Participants: ${dashData.data.totalParticipants}`);

  // 4. Test Candidate Registration API with Payment Proof
  console.log('\n4. Testing Full Registration Submission Flow:');
  const regPayload = {
    selectedEventIds: ['cyber-quiz', 'mini-hackathon', 'cyber-hunt'],
    primaryParticipant: {
      fullName: 'Vikramaditya Sharma',
      email: 'vikram.sharma@gndec.ac.in',
      phone: '9876543210',
      usn: '3GN23CS099',
      college: 'Guru Nanak Dev Engineering College, Bidar',
      department: 'Computer Science and Engineering',
      yearSemester: '3rd Year (5th Sem)',
      githubProfile: 'https://github.com/vikramsharma',
    },
    teamName: 'CyberTitans GNDEC',
    teamMembers: [
      {
        fullName: 'Rohan Gupta',
        email: 'rohan.g@gndec.ac.in',
        phone: '9876543211',
        usn: '3GN23CS100',
        college: 'Guru Nanak Dev Engineering College, Bidar',
        department: 'Computer Science and Engineering',
        yearSemester: '3rd Year (5th Sem)',
      },
      {
        fullName: 'Sneha Patel',
        email: 'sneha.p@gndec.ac.in',
        phone: '9876543212',
        usn: '3GN23CS101',
        college: 'Guru Nanak Dev Engineering College, Bidar',
        department: 'Computer Science and Engineering',
        yearSemester: '3rd Year (5th Sem)',
      },
    ],
    transactionId: 'UTR998877665544',
    screenshotData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  };

  const regRes = await fetch(`${baseUrl}/api/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload),
  });
  assert.strictEqual(regRes.status, 200, 'Registration creation should succeed (HTTP 200)');
  const regData = await regRes.json();
  assert(regData.success, 'Registration must report success: true');
  const regId = regData.registrationId;
  const qrToken = regData.safeToken;
  assert(regId.startsWith('HT26-'), 'Registration ID format must be HT26-XXXXXX');
  assert(qrToken, 'Cryptographic QR token must be generated');
  console.log(`  ✓ Registration created with ID: ${regId}`);
  console.log(`  ✓ Safe QR Token generated: ${qrToken.substring(0, 32)}...`);

  // 5. Test QR Verification Endpoint
  console.log('\n5. Testing Cryptographic QR Verification Pass:');
  const verifyRes = await fetch(`${baseUrl}/api/verify?token=${encodeURIComponent(qrToken)}`);
  assert.strictEqual(verifyRes.status, 200, 'QR verify endpoint should return 200');
  const verifyData = await verifyRes.json();
  assert.strictEqual(verifyData.data.registrationId, regId, 'Pass should identify correct registration ID');
  assert.strictEqual(verifyData.data.participantName, 'Vikramaditya Sharma', 'Pass shows participant name');
  console.log(`  ✓ Accreditation Pass verified successfully: ${verifyData.data.participantName} (${verifyData.data.college})`);

  // 6. Test Admin Payment Verification Queue & Approve
  console.log('\n6. Testing Admin Payment Verification Queue:');
  const payVerifyRes = await fetch(`${baseUrl}/api/admin/payments/${regId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      status: 'VERIFIED',
      adminNote: 'Verified against bank transaction logs. All 3 events cleared.',
    }),
  });
  assert.strictEqual(payVerifyRes.status, 200, 'Payment verification should succeed');
  const payVerifyData = await payVerifyRes.json();
  assert.strictEqual(payVerifyData.success, true, 'Payment verification call succeeded');
  console.log(`  ✓ Payment verified and approved by admin: ${payVerifyData.message}`);

  // Fetch participant ID for attendance and verify status is VERIFIED
  const regDetailRes = await fetch(`${baseUrl}/api/admin/registrations/${regId}`, {
    headers: { Cookie: cookieHeader },
  });
  const regDetail = await regDetailRes.json();
  assert.strictEqual(regDetail.data.registration.paymentStatus, 'VERIFIED', 'Payment status must now be VERIFIED');
  const primaryParticipantId = regDetail.data.participants[0].id;

  // 7. Test QR Attendance Check-In & Duplicate Protection
  console.log('\n7. Testing QR Attendance Check-in:');
  const attRes = await fetch(`${baseUrl}/api/admin/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      registrationId: regId,
      participantId: primaryParticipantId,
      eventId: 'cyber-quiz',
    }),
  });
  assert.strictEqual(attRes.status, 200, 'Attendance check-in should succeed');
  const attData = await attRes.json();
  assert.strictEqual(attData.alreadyMarked, false, 'Attendance marked first time');
  assert.strictEqual(attData.attendance.status, 'PRESENT', 'Attendance marked as PRESENT');
  console.log(`  ✓ Checked in for Cyber Quiz at ${attData.attendance.markedAt}`);

  // Duplicate check-in attempt
  const dupAttRes = await fetch(`${baseUrl}/api/admin/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      registrationId: regId,
      participantId: primaryParticipantId,
      eventId: 'cyber-quiz',
    }),
  });
  const dupData = await dupAttRes.json();
  assert.strictEqual(dupAttRes.status, 200, 'Duplicate check call should return 200');
  assert.strictEqual(dupData.alreadyMarked, true, 'Duplicate check-in should have alreadyMarked: true');
  console.log(`  ✓ Duplicate check-in correctly blocked: ${dupData.message}`);

  // 8. Test Data Exports
  console.log('\n8. Testing Data Export Generation:');
  const csvRes = await fetch(`${baseUrl}/api/admin/exports?format=csv&eventId=cyber-quiz`, {
    headers: { Cookie: cookieHeader },
  });
  assert.strictEqual(csvRes.status, 200, 'CSV export should return 200');
  const csvText = await csvRes.text();
  assert(csvText.includes('Registration ID,Full Name,Email'), 'CSV should contain correct headers');
  assert(csvText.includes(regId), 'CSV should contain our registered participant');
  console.log('  ✓ Filter-aware CSV export generated successfully');

  const xlsxRes = await fetch(`${baseUrl}/api/admin/exports?format=xlsx`, {
    headers: { Cookie: cookieHeader },
  });
  assert.strictEqual(xlsxRes.status, 200, 'XLSX export should return 200');
  assert(xlsxRes.headers.get('content-type')?.includes('spreadsheetml'), 'XLSX should have spreadsheet content type');
  console.log('  ✓ Multi-sheet Excel workbook generated successfully');

  console.log('\n=============================================');
  console.log('🎉 ALL LIVE HTTP E2E INTEGRATION TESTS PASSED!');
  console.log('=============================================\n');
}

runE2EServerTests().catch((err) => {
  console.error('❌ E2E Test Failure:', err);
  process.exit(1);
});
