import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Simple admin verification (in production, use proper role-based auth)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;

    if (token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const roundIdParam = searchParams.get('roundId');

    const rounds = await db.lotteryRound.findMany({
      orderBy: { number: 'desc' },
      take: 50,
    });

    const selectedRoundId = roundIdParam || rounds[0]?.id || null;
    const selectedRound = selectedRoundId
      ? await db.lotteryRound.findUnique({ where: { id: selectedRoundId } })
      : null;

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const successfulPaymentsByUser = await db.payment.groupBy({
      by: ['userId'],
      where: { status: 'SUCCESS' },
      _count: { _all: true },
    });

    const successfulPurchasesMap = new Map<string, number>(
      successfulPaymentsByUser.map((row) => [row.userId, row._count._all])
    );

    const payments = await db.payment.findMany({
      where: selectedRoundId ? { roundId: selectedRoundId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const lotteryCodes = await db.lotteryCode.findMany({
      where: selectedRoundId ? { roundId: selectedRoundId } : undefined,
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const winners = await db.winner.findMany({
      where: selectedRoundId ? { roundId: selectedRoundId } : undefined,
      include: {
        user: true,
        code: true,
      },
      orderBy: { drawDate: 'desc' },
    });

    const settings = await db.lotterySettings.findFirst();

    return NextResponse.json({
      rounds: rounds.map((r) => ({
        id: r.id,
        number: r.number,
        status: r.status,
        startedAt: r.startedAt,
        closedAt: r.closedAt,
        drawDate: r.drawDate,
        capacity: r.capacity,
        entryPrice: Number(r.entryPrice),
        winnersCount: r.winnersCount,
      })),
      selectedRound: selectedRound
        ? {
            id: selectedRound.id,
            number: selectedRound.number,
            status: selectedRound.status,
            startedAt: selectedRound.startedAt,
            closedAt: selectedRound.closedAt,
            drawDate: selectedRound.drawDate,
            capacity: selectedRound.capacity,
            entryPrice: Number(selectedRound.entryPrice),
            winnersCount: selectedRound.winnersCount,
          }
        : null,
      users: users.map(user => ({
        id: user.id,
        mobile: user.mobile,
        instagramId: user.instagramId,
        isActive: user.isActive,
        successfulPurchases: successfulPurchasesMap.get(user.id) ?? 0,
        createdAt: user.createdAt,
      })),
      payments: payments.map(payment => ({
        id: payment.id,
        userId: payment.userId,
        roundId: payment.roundId,
        amount: Number(payment.amount),
        status: payment.status,
        refId: payment.refId,
        createdAt: payment.createdAt,
      })),
      lotteryCodes: lotteryCodes.map(code => ({
        id: code.id,
        code: code.code,
        userId: code.userId,
        roundId: code.roundId,
        userMobile: code.user.mobile,
        createdAt: code.createdAt,
      })),
      winners: winners.map(winner => ({
        id: winner.id,
        userId: winner.userId,
        roundId: winner.roundId,
        userMobile: winner.user.mobile,
        lotteryCode: winner.lotteryCode,
        drawDate: winner.drawDate,
        prizeAmount: Number(winner.prizeAmount),
        createdAt: winner.createdAt,
      })),
      settings: settings
        ? {
            capacity: settings.capacity,
            entryPrice: Number(settings.entryPrice),
            winnersCount: settings.winnersCount,
            status: settings.status,
            drawDate: settings.drawDate,
          }
        : {
            capacity: 1000,
            entryPrice: 50000,
            winnersCount: 1,
            status: 'OPEN',
          },
    });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}
