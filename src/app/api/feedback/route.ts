import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as any;

    const name = typeof body?.name === 'string' ? body.name.trim() : null;
    const mobile = typeof body?.mobile === 'string' ? body.mobile.trim() : null;
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!message || message.length < 5 || message.length > 2000) {
      return NextResponse.json(
        { success: false, message: 'متن پیام نامعتبر است' },
        { status: 400 }
      );
    }

    if (name && name.length > 100) {
      return NextResponse.json(
        { success: false, message: 'نام نامعتبر است' },
        { status: 400 }
      );
    }

    if (mobile && !/^09\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل نامعتبر است' },
        { status: 400 }
      );
    }

    await db.feedback.create({
      data: {
        name: name || null,
        mobile: mobile || null,
        message,
        status: 'NEW',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت پیام' },
      { status: 500 }
    );
  }
}
