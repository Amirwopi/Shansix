import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWinnerSMS } from '@/lib/faraz';

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
    const lotteryCode = typeof body?.lotteryCode === 'string' ? body.lotteryCode.trim() : '';

    if (!lotteryCode) {
      return NextResponse.json(
        { success: false, message: 'کد لاتاری الزامی است' },
        { status: 400 }
      );
    }

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

    const code = await db.lotteryCode.findFirst({
      where: {
        code: lotteryCode,
        roundId: round.id,
      },
      include: { user: true },
    });

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'کد لاتاری در این دوره یافت نشد' },
        { status: 404 }
      );
    }

    const existingWinner = await db.winner.findFirst({
      where: {
        roundId: round.id,
        lotteryCode: code.code,
      },
    });

    if (existingWinner) {
      return NextResponse.json(
        { success: false, message: 'این کد قبلاً برنده شده است' },
        { status: 400 }
      );
    }

    const winnersSoFar = await db.winner.count({ where: { roundId: round.id } });
    if (winnersSoFar >= round.winnersCount) {
      return NextResponse.json(
        { success: false, message: 'تعداد برندگان این دوره تکمیل شده است' },
        { status: 400 }
      );
    }

    const createdWinner = await db.winner.create({
      data: {
        userId: code.userId,
        roundId: round.id,
        lotteryCode: code.code,
        codeNumber: code.codeNumber,
        drawDate: new Date(),
        prizeAmount: BigInt(0),
        prizeType: settings.prizeType || null,
      },
    });

    try {
      await sendWinnerSMS(code.user.mobile, code.code);
    } catch (smsError) {
      console.error('Error sending winner SMS:', smsError);
    }

    await db.transactionLog.create({
      data: {
        userId: code.userId,
        action: 'LOTTERY_WINNER_SELECTED_MANUAL',
        details: `Round=${round.number}. User ${code.user.mobile} won with code ${code.code}. codeNumber=${code.codeNumber}.`,
      },
    });

    const updatedWinnersCount = winnersSoFar + 1;
    if (updatedWinnersCount >= round.winnersCount) {
      await db.lotteryRound.update({
        where: { id: round.id },
        data: { status: 'DRAWN', drawDate: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'برنده با موفقیت ثبت شد',
      winner: {
        id: createdWinner.id,
        userId: createdWinner.userId,
        lotteryCode: createdWinner.lotteryCode,
        codeNumber: createdWinner.codeNumber,
        drawDate: createdWinner.drawDate,
        prizeType: createdWinner.prizeType,
      },
    });
  } catch (error) {
    console.error('Error running lottery:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در انجام قرعه‌کشی' },
      { status: 500 }
    );
  }
}
