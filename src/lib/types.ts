// User types
export interface User {
  id: string;
  mobile: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// OTP types
export interface OTP {
  id: string;
  mobile: string;
  code: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
  userId: string;
}

// Payment types
export interface Payment {
  id: string;
  userId: string;
  amount: bigint;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  authority?: string;
  refId?: string;
  transactionId?: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Lottery Code types
export interface LotteryCode {
  id: string;
  code: string;
  userId: string;
  paymentId: string;
  createdAt: Date;
}

// Lottery Settings types
export interface LotterySettings {
  id: string;
  capacity: number;
  entryPrice: bigint;
  winnersCount: number;
  status: 'OPEN' | 'CLOSED' | 'DRAWN';
  drawDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Winner types
export interface Winner {
  id: string;
  userId: string;
  lotteryCode: string;
  drawDate: Date;
  createdAt: Date;
}

// Transaction Log types
export interface TransactionLog {
  id: string;
  userId?: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// API Request/Response types
export interface SendOTPRequest {
  mobile: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
}

export interface VerifyOTPRequest {
  mobile: string;
  code: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface CreatePaymentRequest {
  amount: number;
}

export interface CreatePaymentResponse {
  success: boolean;
  message: string;
  authority?: string;
  paymentUrl?: string;
}

export interface VerifyPaymentRequest {
  authority: string;
  status: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  lotteryCode?: string;
  refId?: string;
}
