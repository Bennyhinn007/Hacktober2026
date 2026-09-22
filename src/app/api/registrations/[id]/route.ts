import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository';
import { generateSafeToken } from '@/lib/idGenerator';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await dbRepository.getRegistrationById(id);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    const safeToken = generateSafeToken(data.registration.registrationId);

    // Return safe public-facing confirmation payload (never leak internal admin notes)
    return NextResponse.json({
      success: true,
      registration: {
        registrationId: data.registration.registrationId,
        eventIds: data.registration.eventIds,
        type: data.registration.type,
        totalAmount: data.registration.totalAmount,
        paymentStatus: data.registration.paymentStatus,
        attendanceStatus: data.registration.attendanceStatus,
        createdAt: data.registration.createdAt,
      },
      primaryParticipant: data.participants.find((p) => p.isPrimary) || data.participants[0],
      team: data.team
        ? {
            teamName: data.team.teamName,
            eventId: data.team.eventId,
            memberCount: data.participants.length,
            members: data.participants.map((p) => ({
              fullName: p.fullName,
              college: p.college,
              usn: p.usn,
              isPrimary: p.isPrimary,
            })),
          }
        : null,
      payment: data.payment
        ? {
            transactionId: data.payment.transactionId,
            amount: data.payment.amount,
            status: data.payment.status,
          }
        : null,
      safeToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching registration' },
      { status: 500 }
    );
  }
}
