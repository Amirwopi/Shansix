import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';

type Period = 'weekly' | 'monthly' | 'yearly';

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfWeek(d: Date) {
  // Week starts on Saturday (common in Iran). 0=Sun..6=Sat
  const day = d.getDay();
  const diffToSaturday = (day + 1) % 7;
  const base = startOfDay(d);
  base.setDate(base.getDate() - diffToSaturday);
  return base;
}

function startOfWeekUtc(d: Date) {
  const day = d.getUTCDay();
  const diffToSaturday = (day + 1) % 7;
  const base = startOfDayUtc(d);
  base.setUTCDate(base.getUTCDate() - diffToSaturday);
  return base;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfMonthUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

function startOfYearUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

function formatKey(d: Date, period: Period) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  if (period === 'yearly') return String(y);
  if (period === 'monthly') return `${y}-${m}`;
  return `${y}-${m}-${day}`;
}

function bucketStart(d: Date, period: Period) {
  if (period === 'yearly') return startOfYearUtc(d);
  if (period === 'monthly') return startOfMonthUtc(d);
  return startOfWeekUtc(d);
}

function addPeriodsUtc(d: Date, period: Period, count: number) {
  const out = new Date(d);
  if (period === 'yearly') out.setUTCFullYear(out.getUTCFullYear() + count);
  else if (period === 'monthly') out.setUTCMonth(out.getUTCMonth() + count);
  else out.setUTCDate(out.getUTCDate() + 7 * count);
  return out;
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
      where: { status: 'SUCCESS' },
      orderBy: { createdAt: 'asc' },
      include: { user: true, round: true },
    });

    const bucketsCount = period === 'yearly' ? 10 : 12;
    const now = new Date();
    const lastBucketStart = bucketStart(now, period);
    const firstBucketStart = addPeriodsUtc(lastBucketStart, period, -(bucketsCount - 1));

    const seriesMap = new Map<string, { key: string; from: Date; to: Date; revenue: bigint; count: number }>();

    for (let i = 0; i < bucketsCount; i++) {
      const from = addPeriodsUtc(firstBucketStart, period, i);
      const to = addPeriodsUtc(from, period, 1);
      const key = formatKey(from, period);
      seriesMap.set(key, { key, from, to, revenue: BigInt(0), count: 0 });
    }

    for (const p of successfulPayments) {
      const dt = p.paymentDate ? new Date(p.paymentDate) : new Date(p.createdAt);
      const from = bucketStart(dt, period);
      const key = formatKey(from, period);
      const existing = seriesMap.get(key);
      if (!existing) continue;
      existing.revenue += p.amount;
      existing.count += 1;
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
