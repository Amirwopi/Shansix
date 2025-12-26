import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';

type Period = 'weekly' | 'monthly' | 'yearly';

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date) {
  // Week starts on Saturday (common in Iran). 0=Sun..6=Sat
  const day = d.getDay();
  const diffToSaturday = (day + 1) % 7;
  const base = startOfDay(d);
  base.setDate(base.getDate() - diffToSaturday);
  return base;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

function formatKey(d: Date, period: Period) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (period === 'yearly') return String(y);
  if (period === 'monthly') return `${y}-${m}`;
  return `${y}-${m}-${day}`;
}

function bucketStart(d: Date, period: Period) {
  if (period === 'yearly') return startOfYear(d);
  if (period === 'monthly') return startOfMonth(d);
  return startOfWeek(d);
}

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
    const period = (searchParams.get('period') as Period) || 'monthly';

    const rounds = await db.lotteryRound.findMany({
      include: {
        winners: {
          include: {
            user: true,
          },
          orderBy: { drawDate: 'desc' },
        },
      },
      orderBy: { number: 'desc' },
    });

    const successfulPayments = await db.payment.findMany({
      where: { status: 'SUCCESS', paymentDate: { not: null } },
      orderBy: { paymentDate: 'asc' },
      include: { user: true, round: true },
    });

    const seriesMap = new Map<string, { key: string; from: Date; to: Date; revenue: bigint; count: number }>();

    for (const p of successfulPayments) {
      const dt = p.paymentDate ? new Date(p.paymentDate) : new Date(p.createdAt);
      const from = bucketStart(dt, period);
      const to = new Date(from);

      if (period === 'yearly') {
        to.setFullYear(to.getFullYear() + 1);
      } else if (period === 'monthly') {
        to.setMonth(to.getMonth() + 1);
      } else {
        to.setDate(to.getDate() + 7);
      }

      const key = formatKey(from, period);
      const existing = seriesMap.get(key);

      if (existing) {
        existing.revenue += p.amount;
        existing.count += 1;
      } else {
        seriesMap.set(key, {
          key,
          from,
          to,
          revenue: p.amount,
          count: 1,
        });
      }
    }

    const series = Array.from(seriesMap.values())
      .sort((a, b) => a.from.getTime() - b.from.getTime())
      .map((row) => ({
        key: row.key,
        from: row.from,
        to: row.to,
        revenue: Number(row.revenue),
        count: row.count,
      }));

    const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, BigInt(0));

    const winners = rounds
      .flatMap((r) =>
        r.winners.map((w) => ({
          id: w.id,
          userId: w.userId,
          userMobile: w.user.mobile,
          lotteryCode: w.lotteryCode,
          drawDate: w.drawDate,
          prizeAmount: Number(w.prizeAmount),
          roundId: r.id,
          roundNumber: r.number,
          roundStatus: r.status,
          roundStartedAt: r.startedAt,
          roundDrawDate: r.drawDate,
        }))
      )
      .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());

    return NextResponse.json({
      success: true,
      roundsCount: rounds.length,
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
        winners: r.winners.map((w) => ({
          id: w.id,
          userId: w.userId,
          userMobile: w.user.mobile,
          lotteryCode: w.lotteryCode,
          drawDate: w.drawDate,
          prizeAmount: Number(w.prizeAmount),
        })),
      })),
      totals: {
        successfulPayments: successfulPayments.length,
        totalRevenue: Number(totalRevenue),
      },
      winners,
      series,
      payments: successfulPayments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        userId: p.userId,
        userMobile: p.user.mobile,
        roundId: p.roundId,
        roundNumber: p.round?.number ?? null,
        status: p.status,
        refId: p.refId,
        paymentDate: p.paymentDate,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching finance report:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت گزارش مالی' },
      { status: 500 }
    );
  }
}
