import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth/jwt';
import { dbRepository } from '@/lib/db/repository-selector';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const eventId = searchParams.get('eventId') || 'ALL';
    const paymentStatus = searchParams.get('paymentStatus') || 'ALL';
    const attendanceStatus = searchParams.get('attendanceStatus') || 'ALL';
    const department = searchParams.get('department') || 'ALL';
    const yearSemester = searchParams.get('yearSemester') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const result = await dbRepository.listRegistrations({
      search,
      eventId,
      paymentStatus,
      attendanceStatus,
      department,
      yearSemester,
      sortBy,
      sortOrder,
      page,
      limit,
      includeArchived,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error listing registrations' },
      { status: 500 }
    );
  }
}
