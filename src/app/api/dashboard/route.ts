import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jwtVerify } from 'jose';
import { getLatestRound, getOrCreateActiveRound } from '@/lib/round';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function GET(request: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: 'پیکربندی سرور ناقص است (JWT_SECRET تنظیم نشده است)' },
        { status: 500 }
      );
    }

    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'لطفاً وارد شوید' },
        { status: 401 }
      );
    }

    let payload: any;
    try {
      const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      payload = verified.payload;
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

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
    const { round: openRound } = await getOrCreateActiveRound();
    const round = openRound ?? (await getLatestRound());

    if (!round) {
      return NextResponse.json({
        mobile: user.mobile,
        lotteryStatus: settings?.status || 'CLOSED',
        capacity: settings?.capacity ?? 0,
        participants: 0,
        entryPrice: Number(settings?.entryPrice) || 50000,
        winner: null,
        userWins: [],
        lotteryCodes: [],
        payments: [],
      });
    }
    const totalCodes = await db.lotteryCode.count({
      where: { roundId: round.id },
    });

    const winner =
      round.status === 'DRAWN'
        ? await db.winner.findFirst({
            where: { roundId: round.id, userId: user.id },
            orderBy: { drawDate: 'desc' },
          })
        : null;

    const userWins = await db.winner.findMany({
      where: { userId: user.id },
      include: { round: true },
      orderBy: { drawDate: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      mobile: user.mobile,
      lotteryStatus: round.status || settings?.status || 'OPEN',
      capacity: round.capacity,
      participants: totalCodes,
      entryPrice: Number(round.entryPrice) || Number(settings?.entryPrice) || 50000,
      winner: winner
        ? {
            lotteryCode: winner.lotteryCode,
            drawDate: winner.drawDate,
            prizeAmount: Number(winner.prizeAmount),
            prizeType: winner.prizeType ?? settings?.prizeType ?? null,
          }
        : null,
      userWins: userWins.map((w) => ({
        roundNumber: w.round?.number ?? null,
        lotteryCode: w.lotteryCode,
        drawDate: w.drawDate,
        prizeType: w.prizeType ?? settings?.prizeType ?? null,
      })),
      lotteryCodes: user.lotteryCodes
        .filter((c) => c.roundId === round.id)
        .map((code) => ({
          code: code.code,
          createdAt: code.createdAt,
        })),
      payments: user.payments
        .filter((p) => p.roundId === round.id)
        .map((payment) => ({
          amount: Number(payment.amount),
          status: payment.status,
          createdAt: payment.createdAt,
        })),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}
