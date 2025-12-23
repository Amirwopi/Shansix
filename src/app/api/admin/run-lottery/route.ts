import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    if (settings.status !== 'OPEN' && settings.status !== 'CLOSED') {
      return NextResponse.json(
        { success: false, message: 'قرعه‌کشی قبلاً انجام شده است' },
        { status: 400 }
      );
    }

    // Get all valid lottery codes
    const lotteryCodes = await db.lotteryCode.findMany({
      where: {
        winner: null, // Only codes that haven't won
      },
      include: {
        user: true,
      },
    });

    if (lotteryCodes.length === 0) {
      return NextResponse.json(
        { success: false, message: 'هیچ کد قرعه‌کشی‌ای وجود ندارد' },
        { status: 400 }
      );
    }

    if (lotteryCodes.length < settings.winnersCount) {
      return NextResponse.json(
        {
          success: false,
          message: `تعداد کدهای کافی نیست (نیاز به ${settings.winnersCount} کد، وجود دارد ${lotteryCodes.length} کد)`,
        },
        { status: 400 }
      );
    }

    // Fisher-Yates shuffle for random selection
    const shuffledCodes = [...lotteryCodes];
    for (let i = shuffledCodes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCodes[i], shuffledCodes[j]] = [shuffledCodes[j], shuffledCodes[i]];
    }

    // Select winners
    const selectedWinners = shuffledCodes.slice(0, settings.winnersCount);

    // Create winner records
    const winners = [];
    for (const winnerCode of selectedWinners) {
      const winner = await db.winner.create({
        data: {
          userId: winnerCode.userId,
          lotteryCode: winnerCode.code,
          drawDate: new Date(),
        },
      });
      winners.push(winner);

      // TODO: Send SMS to winner using Melipayamak
      // This should use the actual Melipayamak SDK
      console.log(`Winner: ${winnerCode.user.mobile} - Code: ${winnerCode.code}`);

      // Log the winner selection
      await db.transactionLog.create({
        data: {
          userId: winnerCode.userId,
          action: 'LOTTERY_WINNER_SELECTED',
          details: `User ${winnerCode.user.mobile} won with code ${winnerCode.code}`,
        },
      });
    }

    // Update lottery settings to DRAWN
    await db.lotterySettings.update({
      where: { id: settings.id },
      data: {
        status: 'DRAWN',
        drawDate: new Date(),
      },
    });

    // Log the lottery draw
    await db.transactionLog.create({
      data: {
        action: 'LOTTERY_DRAW_COMPLETED',
        details: `Lottery draw completed with ${winners.length} winners selected from ${lotteryCodes.length} participants`,
      },
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
