import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, isAuthorizedRole } from '@/lib/auth/jwt';
import { dbRepository } from '@/lib/db/repository';
import type { AdminRole } from '@/lib/db/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAuthorizedRole(session.role, 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Super Admins can view organizer management.' },
        { status: 403 }
      );
    }

    const organizers = await dbRepository.listAdmins();
    return NextResponse.json({ success: true, data: organizers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error listing organizers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAuthorizedRole(session.role, 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Super Admins can provision organizers.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { success: false, error: 'All fields (email, password, fullName, role) are required.' },
        { status: 400 }
      );
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'VIEWER'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const created = await dbRepository.createAdmin({
      email,
      password,
      fullName,
      role: role as AdminRole,
      creatorEmail: session.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Organizer account created successfully.',
      data: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error creating organizer' },
      { status: 500 }
    );
  }
}
