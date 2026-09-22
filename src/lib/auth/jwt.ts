import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { AdminRole } from '../db/types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'hacktober2026_super_secure_jwt_secret_gndec_bidar_cse_iot_cyber'
);

export const COOKIE_NAME = 'ht26_admin_token';

export interface AdminPayload {
  id: string;
  email: string;
  role: AdminRole;
  fullName: string;
}

export async function signAdminToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(SECRET_KEY);
}

export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function getAdminSessionFromCookies(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function getAdminSessionFromRequest(req: NextRequest): Promise<AdminPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAdminToken(token);
}

// Role Hierarchy: SUPER_ADMIN > ADMIN > VIEWER
const ROLE_LEVELS: Record<AdminRole, number> = {
  SUPER_ADMIN: 3,
  ADMIN: 2,
  VIEWER: 1,
};

export function isAuthorizedRole(userRole: AdminRole, minimumRequiredRole: AdminRole): boolean {
  return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[minimumRequiredRole] || 0);
}
