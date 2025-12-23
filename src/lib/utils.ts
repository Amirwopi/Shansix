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
