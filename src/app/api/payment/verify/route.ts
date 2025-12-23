import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateLotteryCode } from '@/lib/utils';
import { Payment } from 'zarinpal-checkout';

// Initialize ZarinPal
const zarinpal = Payment.create(
  process.env.ZARINPAL_MERCHANT_ID || '',
  process.env.NODE_ENV !== 'production'
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const authority = searchParams.get('Authority');
    const status = searchParams.get('Status');

    if (!authority || !status) {
      return NextResponse.redirect(new URL('/?error=invalid_callback', request.url));
    }

    // Find the payment by authority
    const payment = await db.payment.findUnique({
      where: { authority },
      include: { user: true },
    });

    if (!payment) {
      return NextResponse.redirect(new URL('/?error=payment_not_found', request.url));
    }

    if (status === 'NOK') {
      // Payment failed or cancelled by user
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      // Log the failed transaction
      await db.transactionLog.create({
        data: {
          userId: payment.userId,
          action: 'PAYMENT_FAILED',
          details: `Payment cancelled/failed. Authority: ${authority}`,
        },
      });

      return NextResponse.redirect(
        new URL('/dashboard?error=payment_cancelled', request.url)
      );
    }

    // Payment status is OK - verify with ZarinPal
    try {
      const verifyResponse = await zarinpal.verify({
        amount: Number(payment.amount),
        authority: authority,
      });

      if (verifyResponse.data.code === 100 || verifyResponse.data.code === 101) {
        // Payment is successful
        const refId = verifyResponse.data.ref_id.toString();

        // Check if lottery code already exists for this payment
        const existingCode = await db.lotteryCode.findFirst({
          where: { paymentId: payment.id },
        });

        let lotteryCodeValue: string;

        if (existingCode) {
          lotteryCodeValue = existingCode.code;
        } else {
          // Generate unique lottery code
          let attempts = 0;
          let isUnique = false;
          
          while (!isUnique && attempts < 10) {
            lotteryCodeValue = generateLotteryCode();
            
            const existing = await db.lotteryCode.findUnique({
              where: { code: lotteryCodeValue },
            });
            
            if (!existing) {
              isUnique = true;
            }
            attempts++;
          }

          if (!isUnique) {
            throw new Error('Unable to generate unique lottery code');
          }

          // Create lottery code
          await db.lotteryCode.create({
            data: {
              code: lotteryCodeValue,
              userId: payment.userId,
              paymentId: payment.id,
            },
          });
        }

        // Update payment status
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            refId,
            paymentDate: new Date(),
          },
        });

        // Log the successful transaction
        await db.transactionLog.create({
          data: {
            userId: payment.userId,
            action: 'PAYMENT_SUCCESS',
            details: `Payment verified. Ref ID: ${refId}, Authority: ${authority}, Lottery Code: ${lotteryCodeValue}`,
          },
        });

        // Check if capacity is reached and trigger lottery
        const settings = await db.lotterySettings.findFirst();
        if (settings) {
          const totalCodes = await db.lotteryCode.count();
          
          if (totalCodes >= settings.capacity && settings.status === 'OPEN') {
            // Update lottery status to CLOSED
            await db.lotterySettings.update({
              where: { id: settings.id },
              data: { status: 'CLOSED' },
            });

            // TODO: Trigger automatic lottery draw
            // This could be done via a cron job or immediate execution
            console.log('Lottery capacity reached. Ready to draw winners.');
          }
        }

        // Redirect to dashboard with success message
        return NextResponse.redirect(
          new URL(`/dashboard?success=payment_completed&code=${lotteryCodeValue}`, request.url)
        );
      } else {
        // Payment verification failed
        await db.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });

        await db.transactionLog.create({
          data: {
            userId: payment.userId,
            action: 'PAYMENT_VERIFICATION_FAILED',
            details: `Verification failed. Code: ${verifyResponse.data.code}, Authority: ${authority}`,
          },
        });

        return NextResponse.redirect(
          new URL('/dashboard?error=payment_verification_failed', request.url)
        );
      }
    } catch (verifyError: any) {
      console.error('Payment verification error:', verifyError);

      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      await db.transactionLog.create({
        data: {
          userId: payment.userId,
          action: 'PAYMENT_ERROR',
          details: `Verification error: ${verifyError.message}. Authority: ${authority}`,
        },
      });

      return NextResponse.redirect(
        new URL('/dashboard?error=payment_verification_error', request.url)
      );
    }
  } catch (error) {
    console.error('Error in payment verification callback:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
