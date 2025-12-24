import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jwtVerify } from 'jose';

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || '';
const SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';
const API_BASE_URL = SANDBOX ? 'https://sandbox.zarinpal.com/pg/' : 'https://api.zarinpal.com/pg/';
const START_PAY_BASE_URL = SANDBOX ? 'https://sandbox.zarinpal.com/pg/' : 'https://www.zarinpal.com/pg/';
const CALLBACK_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/zarinpal/verify`;

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: 'لطفاً وارد شوید' }, { status: 401 });
  }

  let userId: string;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    userId = payload.userId as string;
  } catch {
    return NextResponse.json({ success: false, message: 'لطفاً دوباره وارد شوید' }, { status: 401 });
  }

  if (!MERCHANT_ID) {
    return NextResponse.json({ success: false, message: 'پیکربندی زرینپال ناقص است' }, { status: 500 });
  }

  const body = await request.json();
  const { amount, description } = body as { amount?: number; description?: string };

  if (!amount || !description) {
    return NextResponse.json({ success: false, message: 'مبلغ و توضیحات الزامی است' }, { status: 400 });
  }

  const payment = await db.payment.create({
    data: {
      userId,
      amount: BigInt(amount),
      status: 'PENDING',
      authority: null,
    },
  });

  const data = {
    merchant_id: MERCHANT_ID,
    amount: Number(amount),
    description,
    callback_url: CALLBACK_URL,
    metadata: { mobile: '', email: '' },
  };

  try {
    const res = await fetch(`${API_BASE_URL}v4/payment/request.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (result.data?.code === 100 && result.data?.authority) {
      await db.payment.update({
        where: { id: payment.id },
        data: { authority: result.data.authority },
      });

      const payUrl = `${START_PAY_BASE_URL}StartPay/${result.data.authority}`;
      return NextResponse.json({ success: true, url: payUrl });
    }

    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    return NextResponse.json({ success: false, message: result.errors?.message || 'خطا در زرینپال' }, { status: 400 });
  } catch {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    return NextResponse.json({ success: false, message: 'خطای سرور' }, { status: 500 });
  }
}
