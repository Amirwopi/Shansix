import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;

    if (token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const capacity = body.capacity;
    const entryPrice = body.entryPrice;
    const winnersCount = body.winnersCount;
    const status = body.status;

    if (
      typeof capacity !== 'number' ||
      !Number.isInteger(capacity) ||
      capacity <= 0 ||
      typeof entryPrice !== 'number' ||
      !Number.isFinite(entryPrice) ||
      entryPrice <= 0 ||
      typeof winnersCount !== 'number' ||
      !Number.isInteger(winnersCount) ||
      winnersCount <= 0
    ) {
      return NextResponse.json(
        { success: false, message: 'مقادیر تنظیمات نامعتبر است' },
        { status: 400 }
      );
    }

    if (status && status !== 'OPEN' && status !== 'CLOSED' && status !== 'DRAWN') {
      return NextResponse.json(
        { success: false, message: 'وضعیت نامعتبر است' },
        { status: 400 }
      );
    }

    const existing = await db.lotterySettings.findFirst();

    if (!existing) {
      const created = await db.lotterySettings.create({
        data: {
          capacity,
          entryPrice: BigInt(entryPrice),
          winnersCount,
          status: status || 'OPEN',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تنظیمات ذخیره شد',
        settings: {
          capacity: created.capacity,
          entryPrice: Number(created.entryPrice),
          winnersCount: created.winnersCount,
          status: created.status,
          drawDate: created.drawDate,
        },
      });
    }

    const updated = await db.lotterySettings.update({
      where: { id: existing.id },
      data: {
        capacity,
        entryPrice: BigInt(entryPrice),
        winnersCount,
        ...(status ? { status } : {}),
      },
    });

    await db.transactionLog.create({
      data: {
        action: 'LOTTERY_SETTINGS_UPDATED',
        details: `capacity=${capacity}, entryPrice=${entryPrice}, winnersCount=${winnersCount}${status ? `, status=${status}` : ''}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تنظیمات بروزرسانی شد',
      settings: {
        capacity: updated.capacity,
        entryPrice: Number(updated.entryPrice),
        winnersCount: updated.winnersCount,
        status: updated.status,
        drawDate: updated.drawDate,
      },
    });
  } catch (error) {
    console.error('Error updating lottery settings:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در بروزرسانی تنظیمات' },
      { status: 500 }
    );
  }
}
