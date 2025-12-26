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

    const url = request.nextUrl;
    const status = url.searchParams.get('status')?.toUpperCase() || '';

    const where = status && ['NEW', 'READ', 'DONE'].includes(status) ? { status } : undefined;

    const items = await db.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      items: items.map((x) => ({
        id: x.id,
        name: x.name,
        mobile: x.mobile,
        message: x.message,
        status: x.status,
        createdAt: x.createdAt,
        updatedAt: x.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت پیام‌ها' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;

    if (token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز' },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as any;
    const id = typeof body?.id === 'string' ? body.id : '';
    const status = typeof body?.status === 'string' ? body.status.toUpperCase() : '';

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه نامعتبر است' },
        { status: 400 }
      );
    }

    if (!['NEW', 'READ', 'DONE'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'وضعیت نامعتبر است' },
        { status: 400 }
      );
    }

    const updated = await db.feedback.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      item: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی پیام' },
      { status: 500 }
    );
  }
}
