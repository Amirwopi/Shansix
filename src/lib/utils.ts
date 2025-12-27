import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from 'crypto';

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique lottery code in format: LOT-XXXX-YYYY
 * Uses crypto.randomBytes for secure random number generation
 */
export function generateLotteryCode(): string {
  // Generate 4 random hex characters (first segment)
  const segment1 = crypto.randomBytes(2).toString('hex').toUpperCase().substring(0, 4);
  // Generate 4 random hex characters (second segment)
  const segment2 = crypto.randomBytes(2).toString('hex').toUpperCase().substring(0, 4);

  return `LOT-${segment1}-${segment2}`;
}

export function getJalaliYYMMDD(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';

  const yy = year.length >= 2 ? year.slice(-2) : year.padStart(2, '0');
  const mm = month.padStart(2, '0');
  const dd = day.padStart(2, '0');

  return `${yy}${mm}${dd}`;
}

export function generateSequentialLotteryCode(params: {
  codeNumber: number;
  capacity: number;
  roundNumber: number;
  date?: Date;
}): string {
  const { codeNumber, capacity, roundNumber, date } = params;
  const ymd = getJalaliYYMMDD(date ?? new Date());
  const roundWidth = Math.max(2, String(roundNumber).length);
  const rr = String(roundNumber).padStart(roundWidth, '0');
  const width = Math.max(1, String(capacity).length);
  const seq = String(codeNumber).padStart(width, '0');
  return `LOT-${ymd}-${rr}-${seq}`;
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash sensitive data using SHA-256
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a unique transaction ID
 */
export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TXN-${timestamp}-${randomPart}`;
}

/**
 * Validate Iranian mobile number format
 * Pattern: ^09\d{9}$
 */
export function isValidIranianMobile(mobile: string): boolean {
  const iranianMobileRegex = /^09\d{9}$/;
  return iranianMobileRegex.test(mobile);
}

/**
 * Format amount to Iranian Toman format
 */
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseInt(amount, 10) : amount;
  return new Intl.NumberFormat('fa-IR').format(numAmount);
}
