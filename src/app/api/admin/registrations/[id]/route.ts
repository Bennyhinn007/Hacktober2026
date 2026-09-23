import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, isAuthorizedRole } from '@/lib/auth/jwt';
import { dbRepository } from '@/lib/db/repository-selector';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await dbRepository.getRegistrationById(id);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching registration' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: VIEWER cannot modify or archive records
    if (!isAuthorizedRole(session.role, 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Viewer accounts cannot modify registrations.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    if (body.action === 'ARCHIVE') {
      const ok = await dbRepository.toggleArchiveRegistration(id, session.email, true);
      return NextResponse.json({ success: ok, message: 'Registration archived (soft-deleted).' });
    }

    if (body.action === 'RESTORE') {
      const ok = await dbRepository.toggleArchiveRegistration(id, session.email, false);
      return NextResponse.json({ success: ok, message: 'Registration restored.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating registration' },
      { status: 500 }
    );
  }
}
