import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, isAuthorizedRole } from '@/lib/auth/jwt';
import { dbRepository } from '@/lib/db/repository-selector';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAuthorizedRole(session.role, 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Viewers cannot mark attendance.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { registrationId, participantId, eventId } = body;

    if (!registrationId || !participantId || !eventId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters (registrationId, participantId, eventId)' },
        { status: 400 }
      );
    }

    const result = await dbRepository.markAttendance({
      registrationId,
      participantId,
      eventId,
      adminEmail: session.email,
    });

    if (result.alreadyMarked) {
      return NextResponse.json({
        success: true,
        alreadyMarked: true,
        message: 'Attendance was already recorded for this event.',
        attendance: result.attendance,
      });
    }

    return NextResponse.json({
      success: true,
      alreadyMarked: false,
      message: 'Attendance marked PRESENT successfully.',
      attendance: result.attendance,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error recording attendance' },
      { status: 500 }
    );
  }
}
