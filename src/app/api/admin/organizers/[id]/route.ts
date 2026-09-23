import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, isAuthorizedRole } from '@/lib/auth/jwt';
import { dbRepository } from '@/lib/db/repository-selector';
import type { AdminRole } from '@/lib/db/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAuthorizedRole(session.role, 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin privilege required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    if (body.role) {
      await dbRepository.updateAdminRole(id, body.role as AdminRole, session.email);
    }

    if (typeof body.isActive === 'boolean') {
      await dbRepository.toggleAdminActive(id, body.isActive, session.email);
    }

    return NextResponse.json({ success: true, message: 'Organizer updated successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating organizer' },
      { status: 500 }
    );
  }
}
