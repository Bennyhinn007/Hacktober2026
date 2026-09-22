import { NextRequest, NextResponse } from 'next/server';
import { RegistrationWizardSchema } from '@/lib/validation';
import { dbRepository } from '@/lib/db/repository';
import { generateRegistrationId, generateSafeToken } from '@/lib/idGenerator';
import { calculateRegistrationPrice } from '@/lib/constants';
import { uploadPaymentScreenshot } from '@/lib/storage/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate using Zod schema
    const parsed = RegistrationWizardSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid registration form data';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { selectedEventIds, primaryParticipant, teamName, transactionId, screenshotData, screenshotName } = parsed.data;

    // Calculate dynamic pricing from repository settings
    const settings = await dbRepository.getSettings();
    const pricingConfig = settings.pricing as Parameters<typeof calculateRegistrationPrice>[1];
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

    // Generate unique non-sequential ID
    const registrationId = generateRegistrationId();
    const safeToken = generateSafeToken(registrationId);

    // Upload payment proof screenshot exclusively to Cloudinary (zero fallback to database/base64)
    let uploadedScreenshot;
    try {
      uploadedScreenshot = await uploadPaymentScreenshot(screenshotData, registrationId, screenshotName);
    } catch (uploadError: unknown) {
      const uploadErrMsg =
        uploadError instanceof Error ? uploadError.message : 'Payment screenshot upload failed.';
      console.error('[Registration API] Cloudinary upload rejected registration:', uploadErrMsg);
      return NextResponse.json(
        {
          success: false,
          error: uploadErrMsg,
        },
        { status: 502 }
      );
    }

    // Save to database repository with Cloudinary metadata and strictly PENDING payment status
    await dbRepository.createRegistration({
      registration: {
        registrationId,
        eventIds: selectedEventIds,
        type: 'INDIVIDUAL',
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
      teamName: teamName || undefined,
      teamEventId: undefined,
      teamMembers: undefined,
      payment: {
        amount: pricing.amount,
        transactionId: transactionId.trim().toUpperCase(),
        screenshotUrl: uploadedScreenshot.secureUrl, // Cloudinary secure CDN URL
        screenshotMime: uploadedScreenshot.mimeType,
        cloudinaryPublicId: uploadedScreenshot.cloudinaryPublicId,
        originalFilename: uploadedScreenshot.originalFilename,
        fileSize: uploadedScreenshot.fileSize,
        uploadedAt: uploadedScreenshot.uploadedAt,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      registrationId,
      safeToken,
      amount: pricing.amount,
      paymentStatus: 'PENDING',
      message: 'Registration submitted successfully. Payment verification is pending organizer approval.',
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error processing registration.';
    console.error('Registration API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
