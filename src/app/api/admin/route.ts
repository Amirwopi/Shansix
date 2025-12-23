import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Simple admin verification (in production, use proper role-based auth)
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

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const payments = await db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const lotteryCodes = await db.lotteryCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const winners = await db.winner.findMany({
      include: {
        user: true,
        code: true,
      },
      orderBy: { drawDate: 'desc' },
    });

    const settings = await db.lotterySettings.findFirst();

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        mobile: user.mobile,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })),
      payments: payments.map(payment => ({
        id: payment.id,
        userId: payment.userId,
        amount: Number(payment.amount),
        status: payment.status,
        refId: payment.refId,
        createdAt: payment.createdAt,
      })),
      lotteryCodes: lotteryCodes.map(code => ({
        id: code.id,
        code: code.code,
        userId: code.userId,
        createdAt: code.createdAt,
      })),
      winners: winners.map(winner => ({
        id: winner.id,
        userId: winner.userId,
        lotteryCode: winner.lotteryCode,
        drawDate: winner.drawDate,
        createdAt: winner.createdAt,
      })),
      settings: settings
        ? {
            capacity: settings.capacity,
            entryPrice: Number(settings.entryPrice),
            winnersCount: settings.winnersCount,
            status: settings.status,
            drawDate: settings.drawDate,
          }
        : {
            capacity: 1000,
            entryPrice: 50000,
            winnersCount: 1,
            status: 'OPEN',
          },
    });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}
