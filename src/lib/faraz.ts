import { farazSendSMS, farazSMS } from '@aspianet/faraz-sms';

const FARAZ_API_KEY = process.env.FARAZ_API_KEY || '';
const FARAZ_ORIGINATOR = process.env.FARAZ_ORIGINATOR || '';

let initialized = false;

function ensureInit() {
  if (initialized) return;
  if (!FARAZ_API_KEY) {
    throw new Error('Faraz SMS is not configured: missing FARAZ_API_KEY');
  }
  farazSMS.init(FARAZ_API_KEY);
  initialized = true;
}

export async function sendWinnerSMS(recipient: string, lotteryCode: string) {
  if (!FARAZ_ORIGINATOR) {
    throw new Error('Faraz SMS is not configured: missing FARAZ_ORIGINATOR');
  }

  ensureInit();

  const message = `تبریک! شما برنده قرعه کشی مجموعه شانس ایکس شدید. کد قرعه کشی: ${lotteryCode}`;
  return farazSendSMS(FARAZ_ORIGINATOR, [recipient], message);
}
