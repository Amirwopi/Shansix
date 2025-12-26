import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drawLotteryWinners } from '@/lib/lottery';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;

    if (token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز' },
        { status: 401 }
      );
    }

    const settings = await db.lotterySettings.findFirst();

    if (!settings) {
      return NextResponse.json(
        { success: false, message: 'تنظیمات قرعه‌کشی یافت نشد' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({} as any));
    const inputRoundId = typeof body?.roundId === 'string' ? body.roundId : undefined;

    const round = inputRoundId
      ? await db.lotteryRound.findUnique({ where: { id: inputRoundId } })
      : await db.lotteryRound.findFirst({
          where: { status: { in: ['OPEN', 'CLOSED'] } },
          orderBy: { startedAt: 'desc' },
        });

    if (!round) {
      return NextResponse.json(
        { success: false, message: 'قرعه‌کشی فعالی یافت نشد' },
        { status: 404 }
      );
    }

    if (round.status !== 'OPEN' && round.status !== 'CLOSED') {
      return NextResponse.json(
        { success: false, message: 'قرعه‌کشی قبلاً انجام شده است' },
        { status: 400 }
      );
    }

    const winners = await drawLotteryWinners({
      sendSms: true,
      reason: 'MANUAL_ADMIN',
      roundId: round.id,
    });

    return NextResponse.json({
      success: true,
      message: 'قرعه‌کشی با موفقیت انجام شد',
      winners: winners.map(winner => ({
        id: winner.id,
        userId: winner.userId,
        lotteryCode: winner.lotteryCode,
        drawDate: winner.drawDate,
      })),
    });
  } catch (error) {
    console.error('Error running lottery:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در انجام قرعه‌کشی' },
      { status: 500 }
    );
  }
}
