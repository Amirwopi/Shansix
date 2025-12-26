import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isValidIranianMobile } from '@/lib/utils';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRY = '7d'; // Token expires in 7 days
const ADMIN_MOBILE = process.env.ADMIN_MOBILE || '09337309575';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';

export async function POST(request: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: 'پیکربندی سرور ناقص است (JWT_SECRET تنظیم نشده است)' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { mobile, code } = body;

    if (!mobile || !code) {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل و کد تایید الزامی است' },
        { status: 400 }
      );
    }

    if (!isValidIranianMobile(mobile)) {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل نامعتبر است' },
        { status: 400 }
      );
    }

    if (code.length !== 6) {
      return NextResponse.json(
        { success: false, message: 'کد تایید باید 6 رقم باشد' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { mobile },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const otp = await db.oTP.findFirst({
      where: {
        userId: user.id,
        code,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      return NextResponse.json(
        { success: false, message: 'کد تایید نامعتبر یا منقضی شده است' },
        { status: 400 }
      );
    }

    await db.oTP.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    await db.user.update({
      where: { id: user.id },
      data: { isActive: true },
    });

    const token = await new SignJWT({ userId: user.id, mobile: user.mobile })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_EXPIRY)
      .sign(new TextEncoder().encode(JWT_SECRET));

    const isAdmin = mobile === ADMIN_MOBILE;

    const response = NextResponse.json({
      success: true,
      message: 'ورود موفق',
      isAdmin,
      user: {
        id: user.id,
        mobile: user.mobile,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    if (isAdmin) {
      response.cookies.set('admin_token', ADMIN_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در تایید کد' },
      { status: 500 }
    );
  }
}
