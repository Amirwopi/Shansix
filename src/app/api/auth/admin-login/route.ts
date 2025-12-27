import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRY = '7d';

const ADMIN_MOBILE = process.env.ADMIN_MOBILE || '09337309575';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';

function isSecureRequest(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto === 'https';
  }
  return request.nextUrl.protocol === 'https:';
}

export async function POST(request: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: 'پیکربندی سرور ناقص است (JWT_SECRET تنظیم نشده است)' },
        { status: 500 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as any;
    const token = typeof body?.token === 'string' ? body.token : '';

    if (!token || token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'توکن مدیریت نامعتبر است' },
        { status: 401 }
      );
    }

    let user = await db.user.findUnique({
      where: { mobile: ADMIN_MOBILE },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          mobile: ADMIN_MOBILE,
          instagramId: null,
          isActive: true,
        },
      });
    } else if (!user.isActive) {
      user = await db.user.update({
        where: { id: user.id },
        data: { isActive: true },
      });
    }

    const jwt = await new SignJWT({ userId: user.id, mobile: user.mobile })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_EXPIRY)
      .sign(new TextEncoder().encode(JWT_SECRET));

    const response = NextResponse.json({ success: true });

    response.cookies.set('auth_token', jwt, {
      httpOnly: true,
      secure: isSecureRequest(request),
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('admin_token', ADMIN_TOKEN, {
      httpOnly: true,
      secure: isSecureRequest(request),
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error in admin login:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ورود ادمین' },
      { status: 500 }
    );
  }
}
