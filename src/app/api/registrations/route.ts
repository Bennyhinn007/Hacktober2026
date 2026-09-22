import { NextRequest, NextResponse } from 'next/server';
import { RegistrationWizardSchema } from '@/lib/validation';
import { dbRepository } from '@/lib/db/repository';
import { generateRegistrationId, generateSafeToken } from '@/lib/idGenerator';
import { calculateRegistrationPrice } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate using Zod schema
    const parsed = RegistrationWizardSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid registration form data';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { selectedEventIds, primaryParticipant, teamName, teamMembers, transactionId, screenshotData } = parsed.data;

    // Calculate dynamic pricing from repository settings
    const settings = await dbRepository.getSettings();
    const pricingConfig = settings.pricing as any;
    const pricing = calculateRegistrationPrice(selectedEventIds, pricingConfig);

    if (!pricing.canProceed || pricing.amount === null) {
      return NextResponse.json(
        {
          success: false,
          error: pricing.notice || 'Pricing for this combination is currently unfinalized.',
        },
        { status: 400 }
      );
    }

    // Verify team requirement
    const hasTeamEvent =
      selectedEventIds.includes('mini-hackathon') || selectedEventIds.includes('cyber-hunt');
    let teamEventId = '';
    if (hasTeamEvent) {
      teamEventId = selectedEventIds.includes('mini-hackathon')
        ? 'mini-hackathon'
        : 'cyber-hunt';
    }

    // Generate unique non-sequential ID
    const registrationId = generateRegistrationId();
    const safeToken = generateSafeToken(registrationId);

    // Save to database repository
    const result = await dbRepository.createRegistration({
      registration: {
        registrationId,
        eventIds: selectedEventIds,
        type: hasTeamEvent ? (selectedEventIds.length > 1 ? 'MIXED' : 'TEAM') : 'INDIVIDUAL',
        totalAmount: pricing.amount,
        paymentStatus: 'PENDING',
      },
      primaryParticipant: {
        fullName: primaryParticipant.fullName,
        email: primaryParticipant.email,
        phone: primaryParticipant.phone,
        usn: primaryParticipant.usn,
        college: primaryParticipant.college,
        department: primaryParticipant.department,
        yearSemester: primaryParticipant.yearSemester,
        githubProfile: primaryParticipant.githubProfile || '',
        linkedinProfile: primaryParticipant.linkedinProfile || '',
      },
      teamName: hasTeamEvent ? teamName : undefined,
      teamEventId: hasTeamEvent ? teamEventId : undefined,
      teamMembers: hasTeamEvent ? teamMembers : undefined,
      payment: {
        amount: pricing.amount,
        transactionId: transactionId.trim().toUpperCase(),
        screenshotUrl: screenshotData,
        screenshotMime: screenshotData.substring(5, screenshotData.indexOf(';')) || 'image/png',
      },
    });

    return NextResponse.json({
      success: true,
      registrationId,
      safeToken,
      amount: pricing.amount,
      paymentStatus: 'PENDING',
      message: 'Registration submitted successfully.',
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error processing registration.',
      },
      { status: 500 }
    );
  }
}
