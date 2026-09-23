import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, getAdminSessionFromRequest } from '@/lib/auth/jwt';
import { dbRepository } from '@/lib/db/repository-selector';

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (session) {
    dbRepository.addAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      action: 'ADMIN_LOGOUT',
      resource: 'AUTH',
      resourceId: session.id,
    });
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
