import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbRepository } from '@/lib/db/repository-selector';
import { signAdminToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { AdminLoginSchema } from '@/lib/validation';
import { authRateLimiter } from '@/lib/auth/rate-limiter';

// Dummy hash for constant-time comparison when email is not found
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890123456789012345678';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  try {
    const body = await req.json();
    const parsed = AdminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid login details' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limit by IP and by target email
    const ipLockout = authRateLimiter.isLockedOut(`ip:${ip}`);
    const emailLockout = authRateLimiter.isLockedOut(`email:${normalizedEmail}`);

    if (ipLockout.locked || emailLockout.locked) {
      const waitSeconds = Math.max(ipLockout.retryAfterSeconds, emailLockout.retryAfterSeconds);
      const minutes = Math.ceil(waitSeconds / 60);

      dbRepository.addAuditLog({
        adminId: 'SYSTEM',
        adminEmail: normalizedEmail,
        action: 'ADMIN_LOGIN_LOCKED_OUT',
        resource: 'AUTH',
        resourceId: 'RATE_LIMITER',
        ipAddress: ip,
      });

      const response = NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Access temporarily locked for security. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        },
        { status: 429 }
      );
      response.headers.set('Retry-After', String(waitSeconds));
      return response;
    }

    const admin = await dbRepository.findAdminByEmail(normalizedEmail);

    let isMatch = false;
    if (admin) {
      isMatch = bcrypt.compareSync(password, admin.passwordHash);
    } else {
      // Timing attack mitigation: run dummy compare to keep response time uniform
      bcrypt.compareSync(password, DUMMY_HASH);
    }

    if (!admin || !isMatch) {
      // Record failed attempt for both IP and email
      const ipResult = authRateLimiter.recordFailure(`ip:${ip}`);
      const emailResult = authRateLimiter.recordFailure(`email:${normalizedEmail}`);
      const attemptsRemaining = Math.min(ipResult.attemptsLeft, emailResult.attemptsLeft);

      dbRepository.addAuditLog({
        adminId: admin?.id || 'UNKNOWN',
        adminEmail: normalizedEmail,
        action: 'ADMIN_LOGIN_FAILED',
        resource: 'AUTH',
        resourceId: admin?.id || 'UNREGISTERED',
        ipAddress: ip,
      });

      const errorMessage =
        attemptsRemaining <= 0
          ? 'Too many failed login attempts. Account temporarily locked for 15 minutes.'
          : attemptsRemaining <= 2
          ? `Invalid email or security password. ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining before temporary lockout.`
          : 'Invalid email or security password.';

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 401 }
      );
    }

    // Success: Reset failure count
    authRateLimiter.reset(`ip:${ip}`);
    authRateLimiter.reset(`email:${normalizedEmail}`);

    // Sign JWT
    const token = await signAdminToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      fullName: admin.fullName,
    });

    // Audit log success
    dbRepository.addAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ADMIN_LOGIN',
      resource: 'AUTH',
      resourceId: admin.id,
      ipAddress: ip,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60, // 12 hours
    });

    // Security Headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Cache-Control', 'no-store, max-age=0');

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal login error' },
      { status: 500 }
    );
  }
}
