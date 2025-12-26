import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTransactionId } from '@/lib/utils';
import { jwtVerify } from 'jose';
import ZarinPalCheckout from 'zarinpal-checkout';
import { getOrCreateActiveRound } from '@/lib/round';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Initialize ZarinPal
const zarinpal = ZarinPalCheckout.create(
  process.env.ZARINPAL_MERCHANT_ID || '',
  process.env.NODE_ENV !== 'production',
  'IRT'
);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'لطفاً وارد شوید' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'مبلغ نامعتبر است' },
        { status: 400 }
      );
    }

    const settings = await db.lotterySettings.findFirst();

    if (!settings || settings.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, message: 'قرعه‌کشی بسته شده است' },
        { status: 400 }
      );
    }

    const { round } = await getOrCreateActiveRound();

    const totalCodes = await db.lotteryCode.count({
      where: { roundId: round.id },
    });
    if (totalCodes >= round.capacity) {
      return NextResponse.json(
        { success: false, message: 'ظرفیت قرعه‌کشی تکمیل شده است' },
        { status: 400 }
      );
    }

    const transactionId = generateTransactionId();

    const payment = await db.payment.create({
      data: {
        userId: payload.userId as string,
        roundId: round.id,
        amount: BigInt(amount),
        status: 'PENDING',
        transactionId,
        authority: '',
      },
    });

    try {
      const requestResponse = await zarinpal.PaymentRequest({
        Amount: amount.toString(),
        CallbackURL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment/verify`,
        Description: 'شرکت در قرعه‌کشی آنلاین',
        Mobile: (payload.mobile as string) || undefined,
      });

      if (requestResponse.status === 100) {
        const authority = requestResponse.authority;

        await db.payment.update({
          where: { id: payment.id },
          data: { authority },
        });

        const paymentUrl = requestResponse.url;

        return NextResponse.json({
          success: true,
          message: 'درخواست پرداخت ایجاد شد',
          authority,
          paymentUrl,
        });
      } else {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });

        return NextResponse.json(
          {
            success: false,
            message: 'خطا در ایجاد درخواست پرداخت',
          },
          { status: 400 }
        );
      }
    } catch (zarinpalError: any) {
      console.error('ZarinPal error:', zarinpalError);
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      return NextResponse.json(
        {
          success: false,
          message: 'خطا در ارتباط با درگاه پرداخت',
          details: zarinpalError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد درخواست پرداخت' },
      { status: 500 }
    );
  }
}
