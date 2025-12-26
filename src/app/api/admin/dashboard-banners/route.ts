import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';

function isAuthorized(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  return token === ADMIN_TOKEN;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, message: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const items = await db.dashboardBannerItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });

    return NextResponse.json({
      success: true,
      items: items.map((i) => ({
        id: i.id,
        imageUrl: i.imageUrl,
        topText: i.topText,
        bottomText: i.bottomText,
        sortOrder: i.sortOrder,
        isActive: i.isActive,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching admin dashboard banner items:', error);
    return NextResponse.json({ success: false, message: 'خطا در دریافت بنرها' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, message: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({} as any));

    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const topText = typeof body.topText === 'string' ? body.topText.trim() : null;
    const bottomText = typeof body.bottomText === 'string' ? body.bottomText.trim() : null;
    const sortOrder = Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0;
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : true;

    if (!imageUrl) {
      return NextResponse.json({ success: false, message: 'آدرس عکس الزامی است' }, { status: 400 });
    }

    const created = await db.dashboardBannerItem.create({
      data: {
        imageUrl,
        topText: topText || null,
        bottomText: bottomText || null,
        sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        id: created.id,
        imageUrl: created.imageUrl,
        topText: created.topText,
        bottomText: created.bottomText,
        sortOrder: created.sortOrder,
        isActive: created.isActive,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating admin dashboard banner item:', error);
    return NextResponse.json({ success: false, message: 'خطا در ایجاد بنر' }, { status: 500 });
  }
}
