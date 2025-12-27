import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOTP, isValidIranianMobile } from '@/lib/utils';
import { farazSendPattern, farazSMS } from '@aspianet/faraz-sms';

const otpRateLimit = new Map<string, { count: number; lastSent: number }>();

const OTP_EXPIRY_MINUTES = 2;
const MAX_REQUESTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Initialize FarazSMS
const FARAZ_API_KEY = process.env.FARAZ_API_KEY || '';
const FARAZ_ORIGINATOR = process.env.FARAZ_ORIGINATOR || '';
const FARAZ_OTP_PATTERN_CODE = process.env.FARAZ_OTP_PATTERN_CODE || 'blrp83g66hrdc2n';

if (FARAZ_API_KEY) {
  farazSMS.init(FARAZ_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobile, instagramId, name, termsAccepted } = body;

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

    const isRegistered = Boolean(user?.isActive && user?.termsAccepted);

    const shouldRequireRegistrationFields = !isRegistered;

    if (shouldRequireRegistrationFields) {
      const nextName = typeof name === 'string' ? name.trim() : '';
      const nextInstagramId = typeof instagramId === 'string' ? instagramId.trim() : '';
      const nextTermsAccepted = termsAccepted === true;

      if (!nextName) {
        return NextResponse.json(
          { success: false, message: 'نام کاربر الزامی است' },
          { status: 400 }
        );
      }
      if (!nextInstagramId) {
        return NextResponse.json(
          { success: false, message: 'آیدی اینستاگرام الزامی است' },
          { status: 400 }
        );
      }
      if (!nextTermsAccepted) {
        return NextResponse.json(
          { success: false, message: 'لطفاً قوانین سایت را تایید کنید' },
          { status: 400 }
        );
      }
    }

    if (!user) {
      const nextInstagramId = typeof instagramId === 'string' && instagramId.trim() ? instagramId.trim() : null;
      const nextName = typeof name === 'string' && name.trim() ? name.trim() : null;
      user = await db.user.create({
        data: {
          mobile,
          instagramId: nextInstagramId,
          name: nextName,
          termsAccepted: termsAccepted === true,
          isActive: false,
        },
      });
    } else {
      const dataToUpdate: Record<string, any> = {};

      if (!isRegistered) {
        if (typeof instagramId === 'string' && instagramId.trim()) {
          dataToUpdate.instagramId = instagramId.trim();
        }
        if (typeof name === 'string' && name.trim()) {
          dataToUpdate.name = name.trim();
        }
        if (termsAccepted === true) {
          dataToUpdate.termsAccepted = true;
        }
      } else {
        if (typeof instagramId === 'string' && instagramId.trim() && user.instagramId !== instagramId.trim()) {
          dataToUpdate.instagramId = instagramId.trim();
        }
        if (typeof name === 'string' && name.trim() && user.name !== name.trim()) {
          dataToUpdate.name = name.trim();
        }
      }

      if (Object.keys(dataToUpdate).length > 0) {
        user = await db.user.update({
          where: { id: user.id },
          data: dataToUpdate,
        });
      }
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

    // Send SMS using FarazSMS
    try {
      if (!FARAZ_API_KEY || !FARAZ_ORIGINATOR) {
        throw new Error('Faraz SMS is not configured: missing FARAZ_API_KEY or FARAZ_ORIGINATOR');
      }

      const smsResult = await farazSendPattern(
        FARAZ_OTP_PATTERN_CODE,
        FARAZ_ORIGINATOR,
        mobile,
        { code: otp }
      );

      console.log('SMS sent successfully:', smsResult);
    } catch (smsError: any) {
      console.error('Error sending SMS:', smsError);

      // Still return success but log error for monitoring
      // In production, you might want to handle this differently
    }

    // Clean up expired OTPs older than 1 hour
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
}, 5 * 60 * 1000); // Every 5 minutes