import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository-selector';
import { verifySafeToken } from '@/lib/idGenerator';
import { OFFICIAL_EVENTS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token missing' },
        { status: 400 }
      );
    }

    const { isValid, registrationId } = verifySafeToken(token);
    if (!isValid || !registrationId) {
      return NextResponse.json(
        { success: false, error: 'Invalid or forged QR verification pass' },
        { status: 400 }
      );
    }

    const record = await dbRepository.getRegistrationById(registrationId);
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Registration record not found' },
        { status: 404 }
      );
    }

    const primary = record.participants.find((p) => p.isPrimary) || record.participants[0];
    const eventNames = record.registration.eventIds.map(
      (id) => OFFICIAL_EVENTS.find((e) => e.id === id)?.name || id
    );

    return NextResponse.json({
      success: true,
      data: {
        registrationId: record.registration.registrationId,
        participantName: primary ? primary.fullName : 'Participant',
        college: primary ? primary.college : 'N/A',
        usn: primary ? primary.usn : 'N/A',
        events: eventNames,
        eventIds: record.registration.eventIds,
        teamName: record.team?.teamName || null,
        paymentStatus: record.registration.paymentStatus,
        attendanceStatus: record.registration.attendanceStatus,
        attendanceHistory: record.attendance.map((a) => ({
          eventId: a.eventId,
          eventName: OFFICIAL_EVENTS.find((e) => e.id === a.eventId)?.name || a.eventId,
          markedAt: a.markedAt,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error verifying pass' },
      { status: 500 }
    );
  }
}
