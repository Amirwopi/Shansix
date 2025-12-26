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

    const result = await db.$transaction(async (tx) => {
      const activeRound = await tx.lotteryRound.findFirst({
        where: { status: 'OPEN' },
        orderBy: { startedAt: 'desc' },
      });

      const closedRound = activeRound
        ? await tx.lotteryRound.update({
            where: { id: activeRound.id },
            data: { status: 'CLOSED', closedAt: new Date() },
          })
        : null;

      const lastRoundNumber = await tx.lotteryRound.aggregate({
        _max: { number: true },
      });

      const nextRoundNumber = (lastRoundNumber._max.number ?? 0) + 1;

      const newRound = await tx.lotteryRound.create({
        data: {
          number: nextRoundNumber,
          capacity: settings.capacity,
          entryPrice: settings.entryPrice,
          winnersCount: settings.winnersCount,
          status: 'OPEN',
          startedAt: new Date(),
          drawDate: null,
          closedAt: null,
        },
      });

      const updatedSettings = await tx.lotterySettings.update({
        where: { id: settings.id },
        data: {
          status: 'OPEN',
          drawDate: null,
        },
      });

      await tx.transactionLog.create({
        data: {
          action: 'LOTTERY_RESET_NEW_ROUND',
          details: `closedRound=${closedRound?.number ?? '-'}, newRound=${newRound.number}`,
        },
      });

      return { settings: updatedSettings, newRound };
    });

    return NextResponse.json({
      success: true,
      message: 'ریست با موفقیت انجام شد',
      result: {
        newRoundNumber: result.newRound.number,
        newRoundId: result.newRound.id,
      },
      settings: {
        capacity: result.settings.capacity,
        entryPrice: Number(result.settings.entryPrice),
        winnersCount: result.settings.winnersCount,
        status: result.settings.status,
        drawDate: result.settings.drawDate,
      },
    });
  } catch (error) {
    console.error('Error resetting lottery:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ریست قرعه‌کشی' },
      { status: 500 }
    );
  }
}
