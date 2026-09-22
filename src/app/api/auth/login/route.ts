import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbRepository } from '@/lib/db/repository';
import { signAdminToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { AdminLoginSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
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
    const admin = await dbRepository.findAdminByEmail(email);

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = bcrypt.compareSync(password, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Sign JWT
    const token = await signAdminToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      fullName: admin.fullName,
    });

    // Log login
    dbRepository.addAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ADMIN_LOGIN',
      resource: 'AUTH',
      resourceId: admin.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
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

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal login error' },
      { status: 500 }
    );
  }
}
