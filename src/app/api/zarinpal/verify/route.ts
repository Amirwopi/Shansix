import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || '';
const SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';
const API_BASE_URL = SANDBOX ? 'https://sandbox.zarinpal.com/pg/' : 'https://api.zarinpal.com/pg/';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('Status');
  const authority = searchParams.get('Authority');

  if (!authority) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/result?success=false&message=اطلاعات پرداخت نامعتبر است`);
  }

  const payment = await db.payment.findFirst({
    where: { authority },
  });

  if (!payment) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/result?success=false&message=پرداخت یافت نشد`);
  }

  if (status !== 'OK') {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/result?success=false&message=پرداخت لغو شد`);
  }

  if (!MERCHANT_ID) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/result?success=false&message=پیکربندی زرینپال ناقص است`);
  }

  const amount = Number(payment.amount);

  const data = {
    merchant_id: MERCHANT_ID,
    amount,
    authority,
  };

  try {
    const res = await fetch(`${API_BASE_URL}v4/payment/verify.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if ([100, 101].includes(result.data?.code)) {
      const refId = String(result.data.ref_id || '');

      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          refId,
          paymentDate: new Date(),
        },
      });

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/result?success=true&ref_id=${encodeURIComponent(refId)}`);
    }

    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/result?success=false&message=پرداخت ناموفق`);
  } catch {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/payment/result?success=false&message=خطای سرور`);
  }
}
