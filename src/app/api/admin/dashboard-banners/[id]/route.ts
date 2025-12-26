import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';

function isAuthorized(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  return token === ADMIN_TOKEN;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, message: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'شناسه نامعتبر است' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({} as any));

    const data: {
      imageUrl?: string;
      topText?: string | null;
      bottomText?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    } = {};

    if (typeof body.imageUrl === 'string') {
      const v = body.imageUrl.trim();
      if (!v) {
        return NextResponse.json({ success: false, message: 'آدرس عکس نامعتبر است' }, { status: 400 });
      }
      data.imageUrl = v;
    }

    if (typeof body.topText === 'string') {
      data.topText = body.topText.trim() || null;
    }

    if (typeof body.bottomText === 'string') {
      data.bottomText = body.bottomText.trim() || null;
    }

    if (typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)) {
      data.sortOrder = Math.trunc(body.sortOrder);
    }

    if (typeof body.isActive === 'boolean') {
      data.isActive = body.isActive;
    }

    const updated = await db.dashboardBannerItem.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      item: {
        id: updated.id,
        imageUrl: updated.imageUrl,
        topText: updated.topText,
        bottomText: updated.bottomText,
        sortOrder: updated.sortOrder,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating admin dashboard banner item:', error);
    return NextResponse.json({ success: false, message: 'خطا در بروزرسانی بنر' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, message: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'شناسه نامعتبر است' }, { status: 400 });
    }

    await db.dashboardBannerItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin dashboard banner item:', error);
    return NextResponse.json({ success: false, message: 'خطا در حذف بنر' }, { status: 500 });
  }
}
