import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getAdminSessionFromRequest } from '@/lib/auth/jwt';
import { dbRepository } from '@/lib/db/repository';
import { OFFICIAL_EVENTS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') === 'csv' ? 'csv' : 'xlsx';
    const search = searchParams.get('search') || '';
    const eventId = searchParams.get('eventId') || 'ALL';
    const paymentStatus = searchParams.get('paymentStatus') || 'ALL';
    const attendanceStatus = searchParams.get('attendanceStatus') || 'ALL';
    const department = searchParams.get('department') || 'ALL';
    const yearSemester = searchParams.get('yearSemester') || 'ALL';

    // Retrieve all filtered records without pagination limit (up to 10,000)
    const { items } = await dbRepository.listRegistrations({
      search,
      eventId,
      paymentStatus,
      attendanceStatus,
      department,
      yearSemester,
      page: 1,
      limit: 10000,
    });

    // Transform into clean tabular export rows
    const rows = items.map((item) => {
      const p = item.primaryParticipant;
      const eventNames = item.registration.eventIds
        .map((id) => OFFICIAL_EVENTS.find((e) => e.id === id)?.name || id)
        .join('; ');

      return {
        'Registration ID': item.registration.registrationId,
        'Full Name': p?.fullName || 'N/A',
        'Email Address': p?.email || 'N/A',
        'Phone Number': p?.phone || 'N/A',
        'USN / Student ID': p?.usn || 'N/A',
        'College / Institution': p?.college || 'N/A',
        'Department': p?.department || 'N/A',
        'Year / Semester': p?.yearSemester || 'N/A',
        'Registered Events': eventNames,
        'Event Count': item.registration.eventIds.length,
        'Team Name': item.teamName || 'N/A (Individual)',
        'Total Amount (INR)': item.amount,
        'Payment Status': item.paymentStatus,
        'Attendance Status': item.registration.attendanceStatus,
        'Registration Date': new Date(item.registration.createdAt).toLocaleString('en-IN'),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hacktober2026_Registrations');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Hacktober2026_Registrations_${timestamp}.csv"`,
        },
      });
    }

    // XLSX binary buffer
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Hacktober2026_Registrations_${timestamp}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error generating export' },
      { status: 500 }
    );
  }
}
