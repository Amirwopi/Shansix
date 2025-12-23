import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'لطفاً وارد شوید' },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );

      const user = await db.user.findUnique({
        where: { id: payload.userId as string },
        include: {
          lotteryCodes: {
            orderBy: { createdAt: 'desc' },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'کاربر یافت نشد' },
          { status: 404 }
        );
      }

      const settings = await db.lotterySettings.findFirst();
      const totalCodes = await db.lotteryCode.count();

      return NextResponse.json({
        mobile: user.mobile,
        lotteryStatus: settings?.status || 'OPEN',
        capacity: settings?.capacity || 1000,
        participants: totalCodes,
        entryPrice: Number(settings?.entryPrice) || 50000,
        lotteryCodes: user.lotteryCodes.map(code => ({
          code: code.code,
          createdAt: code.createdAt,
        })),
        payments: user.payments.map(payment => ({
          amount: Number(payment.amount),
          status: payment.status,
          createdAt: payment.createdAt,
        })),
      });
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}
