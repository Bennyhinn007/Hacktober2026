import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, isAuthorizedRole } from '@/lib/auth/jwt';
import { dbRepository } from '@/lib/db/repository-selector';
import type { PaymentStatus } from '@/lib/db/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: VIEWER cannot verify or reject payments
    if (!isAuthorizedRole(session.role, 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Viewers are not authorized to verify payments.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const status = body.status as PaymentStatus;
    const adminNote = body.adminNote as string | undefined;

    if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid payment status' }, { status: 400 });
    }

    const success = await dbRepository.updatePaymentStatus(
      id,
      status,
      session.email,
      adminNote
    );

    if (!success) {
      return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Payment status updated to ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating payment' },
      { status: 500 }
    );
  }
}
