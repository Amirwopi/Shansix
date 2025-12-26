import { db } from '@/lib/db';
import { sendWinnerSMS } from '@/lib/faraz';

export async function drawLotteryWinners(options?: { sendSms?: boolean; reason?: string; roundId?: string }) {
  const sendSms = options?.sendSms ?? true;
  const reason = options?.reason || 'MANUAL';
  const inputRoundId = options?.roundId;

  const round = inputRoundId
    ? await db.lotteryRound.findUnique({ where: { id: inputRoundId } })
    : await db.lotteryRound.findFirst({
        where: { status: { in: ['OPEN', 'CLOSED'] } },
        orderBy: { startedAt: 'desc' },
      });

  if (!round) {
    throw new Error('Lottery round not found');
  }

  if (round.status !== 'OPEN' && round.status !== 'CLOSED') {
    throw new Error('Lottery has already been drawn');
  }

  const lotteryCodes = await db.lotteryCode.findMany({
    where: {
      winner: null,
      roundId: round.id,
    },
    include: {
      user: true,
    },
  });

  if (lotteryCodes.length === 0) {
    throw new Error('No lottery codes available');
  }

  if (lotteryCodes.length < round.winnersCount) {
    throw new Error('Not enough lottery codes to select winners');
  }

  const shuffledCodes = [...lotteryCodes];
  for (let i = shuffledCodes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledCodes[i], shuffledCodes[j]] = [shuffledCodes[j], shuffledCodes[i]];
  }

  const selectedWinners = shuffledCodes.slice(0, round.winnersCount);

  const totalRevenue = await db.payment.aggregate({
    where: { roundId: round.id, status: 'SUCCESS' },
    _sum: { amount: true },
  });

  const totalRevenueAmount = totalRevenue._sum.amount ?? BigInt(0);
  const prizeAmountPerWinner = BigInt(round.winnersCount) > BigInt(0)
    ? totalRevenueAmount / BigInt(round.winnersCount)
    : BigInt(0);

  const winners = [];
  for (const winnerCode of selectedWinners) {
    const winner = await db.winner.create({
      data: {
        userId: winnerCode.userId,
        roundId: round.id,
        lotteryCode: winnerCode.code,
        drawDate: new Date(),
        prizeAmount: prizeAmountPerWinner,
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
        details: `Reason: ${reason}. Round=${round.number}. User ${winnerCode.user.mobile} won with code ${winnerCode.code}. prizeAmount=${prizeAmountPerWinner.toString()}`,
      },
    });
  }

  await db.lotteryRound.update({
    where: { id: round.id },
    data: {
      status: 'DRAWN',
      drawDate: new Date(),
    },
  });

  await db.transactionLog.create({
    data: {
      action: 'LOTTERY_DRAW_COMPLETED',
      details: `Reason: ${reason}. Round=${round.number}. Lottery draw completed with ${winners.length} winners selected from ${lotteryCodes.length} participants. totalRevenue=${totalRevenueAmount.toString()}`,
    },
  });

  return winners;
}
