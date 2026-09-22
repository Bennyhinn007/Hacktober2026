import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, isAuthorizedRole } from '@/lib/auth/jwt';
import { dbRepository } from '@/lib/db/repository';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await dbRepository.getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAuthorizedRole(session.role, 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Viewer accounts cannot modify system settings.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: 'Key and value required' }, { status: 400 });
    }

    await dbRepository.updateSetting(key, value, session.email);
    return NextResponse.json({ success: true, message: `Setting ${key} updated successfully.` });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating settings' },
      { status: 500 }
    );
  }
}
