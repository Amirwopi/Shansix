import { db } from '@/lib/db';
import { sendWinnerSMS } from '@/lib/faraz';

export async function drawLotteryWinners(options?: { sendSms?: boolean; reason?: string }) {
  const sendSms = options?.sendSms ?? true;
  const reason = options?.reason || 'MANUAL';

  const settings = await db.lotterySettings.findFirst();

  if (!settings) {
    throw new Error('Lottery settings not found');
  }

  if (settings.status !== 'OPEN' && settings.status !== 'CLOSED') {
    throw new Error('Lottery has already been drawn');
  }

  const lotteryCodes = await db.lotteryCode.findMany({
    where: {
      winner: null,
    },
    include: {
      user: true,
    },
  });

  if (lotteryCodes.length === 0) {
    throw new Error('No lottery codes available');
  }

  if (lotteryCodes.length < settings.winnersCount) {
    throw new Error('Not enough lottery codes to select winners');
  }

  const shuffledCodes = [...lotteryCodes];
  for (let i = shuffledCodes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledCodes[i], shuffledCodes[j]] = [shuffledCodes[j], shuffledCodes[i]];
  }

  const selectedWinners = shuffledCodes.slice(0, settings.winnersCount);

  const winners = [];
  for (const winnerCode of selectedWinners) {
    const winner = await db.winner.create({
      data: {
        userId: winnerCode.userId,
        lotteryCode: winnerCode.code,
        drawDate: new Date(),
      },
    });

    winners.push(winner);

    if (sendSms) {
      try {
        await sendWinnerSMS(winnerCode.user.mobile, winnerCode.code);
      } catch (smsError) {
        console.error('Error sending winner SMS:', smsError);
      }
    }

    await db.transactionLog.create({
      data: {
        userId: winnerCode.userId,
        action: 'LOTTERY_WINNER_SELECTED',
        details: `Reason: ${reason}. User ${winnerCode.user.mobile} won with code ${winnerCode.code}`,
      },
    });
  }

  await db.lotterySettings.update({
    where: { id: settings.id },
    data: {
      status: 'DRAWN',
      drawDate: new Date(),
    },
  });

  await db.transactionLog.create({
    data: {
      action: 'LOTTERY_DRAW_COMPLETED',
      details: `Reason: ${reason}. Lottery draw completed with ${winners.length} winners selected from ${lotteryCodes.length} participants`,
    },
  });

  return winners;
}
