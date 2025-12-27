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

  return { round: null, settings };
}

export async function getLatestRound() {
  return db.lotteryRound.findFirst({
    orderBy: { startedAt: 'desc' },
  });
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
    const createdSettings = await db.lotterySettings.create({
      data: {
        capacity: 1000,
        entryPrice: 50000,
        winnersCount: 1,
        status: 'OPEN',
      },
    });

    const nextNumber = await getNextRoundNumber();

    return db.lotteryRound.create({
      data: {
        number: nextNumber,
        capacity: createdSettings.capacity,
        entryPrice: createdSettings.entryPrice,
        winnersCount: createdSettings.winnersCount,
        status: 'OPEN',
        startedAt: new Date(),
        drawDate: null,
        closedAt: null,
      },
    });
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
