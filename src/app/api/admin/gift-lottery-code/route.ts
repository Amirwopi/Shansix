import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSequentialLotteryCode } from '@/lib/utils';

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

    const body = (await request.json().catch(() => ({}))) as any;

    const mobile = typeof body?.mobile === 'string' ? body.mobile.trim() : '';
    const instagramId = typeof body?.instagramId === 'string' ? body.instagramId.trim() : '';
    const inputRoundId = typeof body?.roundId === 'string' ? body.roundId : undefined;
    const count = typeof body?.count === 'number' && Number.isInteger(body.count) && body.count > 0 ? body.count : 1;

    if (!mobile && !instagramId) {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل یا آیدی اینستاگرام الزامی است' },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: mobile ? { mobile } : { instagramId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    let round = inputRoundId
      ? await db.lotteryRound.findUnique({ where: { id: inputRoundId } })
      : await db.lotteryRound.findFirst({
          where: { status: 'OPEN' },
          orderBy: { startedAt: 'desc' },
        });

    if (!round) {
      return NextResponse.json(
        { success: false, message: 'دوره‌ای برای صدور کد پیدا نشد. لطفاً یک دوره را از طریق تنظیمات شروع کنید.' },
        { status: 404 }
      );
    }

    if (round.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, message: 'این دوره برای صدور کد باز نیست' },
        { status: 400 }
      );
    }

    const created = await db.$transaction(async (tx) => {
      const existingCount = await tx.lotteryCode.count({ where: { roundId: round.id } });

      if (existingCount + count > round.capacity) {
        throw new Error('CAPACITY_FULL');
      }

      const createdCodes: Array<{ code: string; codeNumber: number }> = [];

      for (let i = 0; i < count; i++) {
        const maxAgg = await tx.lotteryCode.aggregate({
          where: { roundId: round.id },
          _max: { codeNumber: true },
        });

        let codeNumber = (maxAgg._max.codeNumber ?? 0) + 1;
        let codeValue = '';

        for (let attempt = 0; attempt < 10; attempt++) {
          if (codeNumber > round.capacity) {
            throw new Error('CAPACITY_FULL');
          }

          codeValue = generateSequentialLotteryCode({
            codeNumber,
            capacity: round.capacity,
            roundNumber: round.number,
            date: new Date(),
          });

          try {
            await tx.lotteryCode.create({
              data: {
                code: codeValue,
                codeNumber,
                userId: user.id,
                paymentId: null,
                roundId: round.id,
              },
            });

            createdCodes.push({ code: codeValue, codeNumber });
            break;
          } catch (e: any) {
            if (e?.code === 'P2002') {
              codeNumber += 1;
              continue;
            }
            throw e;
          }
        }

        await tx.transactionLog.create({
          data: {
            userId: user.id,
            action: 'LOTTERY_CODE_GIFTED',
            details: `Round=${round.number}. code=${codeValue}. codeNumber=${codeNumber}. giftedByAdmin=true`,
          },
        });
      }

      return createdCodes;
    });

    return NextResponse.json({
      success: true,
      message: 'کد هدیه با موفقیت صادر شد',
      user: { id: user.id, mobile: user.mobile, instagramId: user.instagramId },
      round: { id: round.id, number: round.number },
      codes: created,
    });
  } catch (error: any) {
    if (error?.message === 'CAPACITY_FULL') {
      return NextResponse.json(
        { success: false, message: 'ظرفیت این دوره تکمیل شده است' },
        { status: 400 }
      );
    }

    if (error?.message === 'DUPLICATE_CODE') {
      return NextResponse.json(
        { success: false, message: 'کد تکراری ایجاد شد. لطفاً مجدداً تلاش کنید.' },
        { status: 409 }
      );
    }

    console.error('Error gifting lottery code:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در صدور کد هدیه' },
      { status: 500 }
    );
  }
}
