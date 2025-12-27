import { db } from '@/lib/db';

async function getNextRoundNumber() {
  const last = await db.lotteryRound.aggregate({
    _max: { number: true },
  });

  return (last._max.number ?? 0) + 1;
}

export async function getOrCreateActiveRound() {
  let settings = await db.lotterySettings.findFirst();

  if (!settings) {
    settings = await db.lotterySettings.create({
      data: {
        capacity: 1000,
        entryPrice: 50000,
        winnersCount: 1,
        status: 'OPEN',
      },
    });
  }

  const existingOpenRound = await db.lotteryRound.findFirst({
    where: { status: 'OPEN' },
    orderBy: { startedAt: 'desc' },
  });

  if (existingOpenRound) {
    return { round: existingOpenRound, settings };
  }

  const latestRound = await db.lotteryRound.findFirst({
    orderBy: { startedAt: 'desc' },
  });

  if (latestRound) {
    return { round: latestRound, settings };
  }

  const nextNumber = await getNextRoundNumber();
  const created = await db.lotteryRound.create({
    data: {
      number: nextNumber,
      capacity: settings.capacity,
      entryPrice: settings.entryPrice,
      winnersCount: settings.winnersCount,
      status: 'OPEN',
      startedAt: new Date(),
      drawDate: null,
      closedAt: null,
    },
  });

  return { round: created, settings };
}

export async function closeActiveRoundIfAny() {
  const existingOpenRound = await db.lotteryRound.findFirst({
    where: { status: 'OPEN' },
    orderBy: { startedAt: 'desc' },
  });

  if (!existingOpenRound) {
    return null;
  }

  return db.lotteryRound.update({
    where: { id: existingOpenRound.id },
    data: { status: 'CLOSED', closedAt: new Date() },
  });
}

export async function createNewOpenRoundFromSettings() {
  const settings = await db.lotterySettings.findFirst();

  if (!settings) {
    throw new Error('Lottery settings not found');
  }

  const nextNumber = await getNextRoundNumber();

  return db.lotteryRound.create({
    data: {
      number: nextNumber,
      capacity: settings.capacity,
      entryPrice: settings.entryPrice,
      winnersCount: settings.winnersCount,
      status: 'OPEN',
      startedAt: new Date(),
      drawDate: null,
      closedAt: null,
    },
  });
}
