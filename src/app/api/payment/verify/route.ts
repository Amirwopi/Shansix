import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSequentialLotteryCode } from '@/lib/utils';
import ZarinPalCheckout from 'zarinpal-checkout';

// Initialize ZarinPal
const zarinpal = ZarinPalCheckout.create(
  process.env.ZARINPAL_MERCHANT_ID || '',
  process.env.NODE_ENV !== 'production',
  'IRT'
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const authority = searchParams.get('Authority');
    const status = searchParams.get('Status');

    if (!authority || !status) {
      return NextResponse.redirect(
        new URL('/payment/result?success=false&message=invalid_callback', request.url)
      );
    }

    // Find the payment by authority
    const payment = await db.payment.findFirst({
      where: { authority },
      include: { user: true },
    });

    if (!payment) {
      return NextResponse.redirect(
        new URL('/payment/result?success=false&message=payment_not_found', request.url)
      );
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
        new URL('/payment/result?success=false&message=payment_cancelled', request.url)
      );
    }

    // Payment status is OK - verify with ZarinPal
    try {
      const verifyResponse = await zarinpal.PaymentVerification({
        Amount: payment.amount.toString(),
        Authority: authority,
      });

      if (verifyResponse.status === 100 || verifyResponse.status === 101) {
        // Payment is successful
        const refId = verifyResponse.RefID?.toString() || '';

        // Check if lottery code already exists for this payment
        const existingCode = await db.lotteryCode.findFirst({
          where: { paymentId: payment.id },
        });

        let lotteryCodeValue = '';

        if (existingCode) {
          lotteryCodeValue = existingCode.code;
        } else {
          await db.$transaction(async (tx) => {
            if (!payment.roundId) {
              throw new Error('ROUND_NOT_FOUND');
            }

            const round = await tx.lotteryRound.findUnique({ where: { id: payment.roundId } });
            if (!round) {
              throw new Error('ROUND_NOT_FOUND');
            }

            const maxAgg = await tx.lotteryCode.aggregate({
              where: { roundId: payment.roundId },
              _max: { codeNumber: true },
            });

            let nextCodeNumber = (maxAgg._max.codeNumber ?? 0) + 1;

            // Retry on unique collisions by incrementing local codeNumber.
            for (let attempt = 0; attempt < 10; attempt++) {
              if (nextCodeNumber > round.capacity) {
                throw new Error('CAPACITY_FULL');
              }

              const candidate = generateSequentialLotteryCode({
                codeNumber: nextCodeNumber,
                capacity: round.capacity,
                roundNumber: round.number,
                date: new Date(),
              });

              try {
                await tx.lotteryCode.create({
                  data: {
                    code: candidate,
                    codeNumber: nextCodeNumber,
                    userId: payment.userId,
                    paymentId: payment.id,
                    roundId: payment.roundId,
                  },
                });

                lotteryCodeValue = candidate;
                return;
              } catch (e: any) {
                // Prisma unique constraint violation
                if (e?.code === 'P2002') {
                  nextCodeNumber += 1;
                  continue;
                }
                throw e;
              }
            }

            throw new Error('DUPLICATE_CODE');
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

        // Close the round when capacity is reached (no automatic draw)
        if (payment.roundId) {
          const round = await db.lotteryRound.findUnique({
            where: { id: payment.roundId },
          });

          if (round) {
            const totalCodes = await db.lotteryCode.count({
              where: { roundId: round.id },
            });

            if (totalCodes >= round.capacity && round.status === 'OPEN') {
              await db.lotteryRound.update({
                where: { id: round.id },
                data: { status: 'CLOSED', closedAt: new Date() },
              });
            }
          }
        }

        // Redirect to dashboard with success message
        return NextResponse.redirect(
          new URL(
            `/payment/result?success=true&ref_id=${encodeURIComponent(refId)}&message=payment_completed`,
            request.url
          )
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
            details: `Verification failed. Code: ${verifyResponse.status}, Authority: ${authority}`,
          },
        });

        return NextResponse.redirect(
          new URL('/payment/result?success=false&message=payment_verification_failed', request.url)
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
        new URL('/payment/result?success=false&message=payment_verification_error', request.url)
      );
    }
  } catch (error) {
    console.error('Error in payment verification callback:', error);
    return NextResponse.redirect(
      new URL('/payment/result?success=false&message=server_error', request.url)
    );
  }
}
