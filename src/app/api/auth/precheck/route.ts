import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isValidIranianMobile } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mobile = searchParams.get('mobile') || '';

    if (!mobile || !isValidIranianMobile(mobile)) {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل نامعتبر است' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { mobile } });

    const registered = Boolean(user?.isActive && user?.termsAccepted);

    return NextResponse.json({
      success: true,
      exists: Boolean(user),
      registered,
      user: user
        ? {
            id: user.id,
            mobile: user.mobile,
            instagramId: user.instagramId,
            name: user.name,
            termsAccepted: user.termsAccepted,
            isActive: user.isActive,
            createdAt: user.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Error in auth precheck:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در بررسی وضعیت کاربر' },
      { status: 500 }
    );
  }
}
