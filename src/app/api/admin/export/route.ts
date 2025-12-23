import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;

    if (token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز' },
        { status: 401 }
      );
    }

    // Fetch all data for export
    const users = await db.user.findMany({
      include: {
        lotteryCodes: true,
        payments: true,
        winners: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Create CSV data
    const headers = [
      'نام کاربری',
      'شماره موبایل',
      'وضعیت',
      'تاریخ ثبت‌نام',
      'تعداد کدها',
      'مجموع پرداخت',
      'وضعیت برنده',
    ];

    const rows = users.map(user => {
      const totalPayments = user.payments
        .filter(p => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      const isWinner = user.winners.length > 0;

      return [
        user.mobile,
        user.mobile,
        user.isActive ? 'فعال' : 'غیرفعال',
        new Date(user.createdAt).toLocaleDateString('fa-IR'),
        user.lotteryCodes.length.toString(),
        totalPayments.toLocaleString('fa-IR'),
        isWinner ? 'برنده' : '-',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create Excel-like CSV with BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="lottery-report-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دانلود گزارش' },
      { status: 500 }
    );
  }
}
