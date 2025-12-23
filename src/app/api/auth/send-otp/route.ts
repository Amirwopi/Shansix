import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOTP, isValidIranianMobile } from '@/lib/utils';
import Melipayamak from 'melipayamak';

const otpRateLimit = new Map<string, { count: number; lastSent: number }>();

const OTP_EXPIRY_MINUTES = 2;
const MAX_REQUESTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Initialize Melipayamak SMS service
const smsUsername = process.env.MELIPAYAMAK_USERNAME || '';
const smsPassword = process.env.MELIPAYAMAK_PASSWORD || '';
const smsApi = new Melipayamak(smsUsername, smsPassword);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobile } = body;

    if (!mobile || !isValidIranianMobile(mobile)) {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل نامعتبر است' },
        { status: 400 }
      );
    }

    const now = Date.now();
    const rateLimitData = otpRateLimit.get(mobile);

    if (rateLimitData) {
      const timeSinceLastRequest = now - rateLimitData.lastSent;

      if (timeSinceLastRequest < RATE_LIMIT_WINDOW_MS) {
        if (rateLimitData.count >= MAX_REQUESTS_PER_WINDOW) {
          return NextResponse.json(
            {
              success: false,
              message: `لطفاً بعد از ${Math.ceil((RATE_LIMIT_WINDOW_MS - timeSinceLastRequest) / 1000)} ثانیه تلاش کنید`,
            },
            { status: 429 }
          );
        }
        rateLimitData.count++;
      } else {
        rateLimitData.count = 1;
      }
      rateLimitData.lastSent = now;
    } else {
      otpRateLimit.set(mobile, { count: 1, lastSent: now });
    }

    const otp = generateOTP();
    const expiresAt = new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000);

    let user = await db.user.findUnique({
      where: { mobile },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          mobile,
          isActive: false,
        },
      });
    }

    await db.oTP.create({
      data: {
        mobile,
        code: otp,
        expiresAt,
        userId: user.id,
        verified: false,
      },
    });

    // Send real SMS using Melipayamak SDK
    try {
      const smsResult = await smsApi.sendByBaseNumber(
        process.env.MELIPAYAMAK_OTP_PATTERN_CODE || '', // Pattern code in Melipayamak panel
        mobile,
        [{ verificationCode: otp }] // Parameters for the pattern
      );

      console.log('SMS sent successfully:', smsResult);
    } catch (smsError: any) {
      console.error('Error sending SMS:', smsError);
      
      // If pattern-based sending fails, try simple text SMS
      try {
        await smsApi.send(
          mobile,
          `کد تایید شما: ${otp}\nاین کد تا 2 دقیقه معتبر است.`,
          process.env.MELIPAYAMAK_SENDER_NUMBER || ''
        );
        console.log('Fallback SMS sent successfully');
      } catch (fallbackError) {
        console.error('Fallback SMS also failed:', fallbackError);
        // Still return success but log error for monitoring
        // In production, you might want to handle this differently
      }
    }

    await db.oTP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(now - 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'کد تایید ارسال شد',
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال کد تایید' },
      { status: 500 }
    );
  }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [mobile, data] of otpRateLimit.entries()) {
    if (now - data.lastSent > RATE_LIMIT_WINDOW_MS * 10) {
      otpRateLimit.delete(mobile);
    }
  }
}, 5 * 60 * 1000);
