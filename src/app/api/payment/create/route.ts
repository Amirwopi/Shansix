import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTransactionId, generateLotteryCode } from '@/lib/utils';
import { jwtVerify } from 'jose';
import { Payment } from 'zarinpal-checkout';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Initialize ZarinPal
const zarinpal = Payment.create(
  process.env.ZARINPAL_MERCHANT_ID || '',
  process.env.NODE_ENV !== 'production' // Sandbox mode for development
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

    const totalCodes = await db.lotteryCode.count();
    if (totalCodes >= settings.capacity) {
      return NextResponse.json(
        { success: false, message: 'ظرفیت قرعه‌کشی تکمیل شده است' },
        { status: 400 }
      );
    }

    const transactionId = generateTransactionId();

    const payment = await db.payment.create({
      data: {
        userId: payload.userId as string,
        amount: BigInt(amount),
        status: 'PENDING',
        transactionId,
        authority: '',
      },
    });

    try {
      // Use zarinpal-checkout SDK to create payment request
      const requestResponse = await zarinpal.request({
        amount: amount,
        currency: 'IRT',
        description: 'شرکت در قرعه‌کشی آنلاین',
        metadata: {
          mobile: payload.mobile,
          paymentId: payment.id,
          userId: payload.userId,
        },
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment/verify`,
      });

      if (requestResponse.data.code === 100) {
        const authority = requestResponse.data.authority;

        await db.payment.update({
          where: { id: payment.id },
          data: { authority },
        });

        // Generate payment URL using zarinpal-checkout SDK
        const paymentUrl = zarinpal.createPaymentURL(authority);

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
            message: requestResponse.errors?.message || 'خطا در ایجاد درخواست پرداخت',
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
