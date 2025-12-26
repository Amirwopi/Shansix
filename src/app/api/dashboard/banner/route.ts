import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const items = await db.dashboardBannerItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });

    return NextResponse.json({
      success: true,
      items: items.map((i) => ({
        id: i.id,
        imageUrl: i.imageUrl,
        topText: i.topText,
        bottomText: i.bottomText,
        sortOrder: i.sortOrder,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard banner items:', error);
    return NextResponse.json({ success: false, message: 'خطا در دریافت بنرها' }, { status: 500 });
  }
}
