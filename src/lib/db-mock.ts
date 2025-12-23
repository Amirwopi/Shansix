// Mock Prisma Client for offline development
// This will be replaced by proper generated client once network issue is resolved

export interface User {
  id: string;
  mobile: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OTP {
  id: string;
  mobile: string;
  code: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
  userId: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: bigint;
  status: string;
  authority?: string;
  refId?: string;
  transactionId?: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LotteryCode {
  id: string;
  code: string;
  userId: string;
  paymentId: string;
  createdAt: Date;
}

export interface LotterySettings {
  id: string;
  capacity: number;
  entryPrice: bigint;
  winnersCount: number;
  status: string;
  drawDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Winner {
  id: string;
  userId: string;
  lotteryCode: string;
  drawDate: Date;
  createdAt: Date;
}

export interface TransactionLog {
  id: string;
  userId?: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// In-memory database for development (will be replaced with Prisma)
const inMemoryDB = {
  users: [] as User[],
  otps: [] as OTP[],
  payments: [] as Payment[],
  lotteryCodes: [] as LotteryCode[],
  settings: null as LotterySettings | null,
  winners: [] as Winner[],
  logs: [] as TransactionLog[],
};

export const db = {
  user: {
    findUnique: async (args: any) => inMemoryDB.users.find(u => u[args.where.mobile]),
    create: async (args: any) => {
      const newUser: User = {
        id: crypto.randomUUID(),
        mobile: args.data.mobile,
        isActive: args.data.isActive ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryDB.users.push(newUser);
      return newUser;
    },
    update: async (args: any) => {
      const user = inMemoryDB.users.find(u => u[args.where.id]);
      if (user) {
        Object.assign(user, args.data);
        user.updatedAt = new Date();
      }
      return user;
    },
    findMany: async () => inMemoryDB.users,
  },
  oTP: {
    create: async (args: any) => {
      const newOTP: OTP = {
        id: crypto.randomUUID(),
        mobile: args.data.mobile,
        code: args.data.code,
        expiresAt: args.data.expiresAt,
        verified: false,
        createdAt: new Date(),
        userId: args.data.userId,
      };
      inMemoryDB.otps.push(newOTP);
      return newOTP;
    },
    findFirst: async (args: any) => {
      return inMemoryDB.otps.find(o => 
        (!args.where.verified || o.verified === args.where.verified) &&
        (!args.where.mobile || o.mobile === args.where.mobile) &&
        (!args.where.expiresAt || o.expiresAt >= new Date())
      );
    },
    update: async (args: any) => {
      const otp = inMemoryDB.otps.find(o => o[args.where.id]);
      if (otp) {
        Object.assign(otp, args.data);
      }
      return otp;
    },
    deleteMany: async (args: any) => {
      inMemoryDB.otps = inMemoryDB.otps.filter(o => 
        !(args.where.expiresAt && o.expiresAt < new Date())
      );
    },
  },
  payment: {
    create: async (args: any) => {
      const newPayment: Payment = {
        id: crypto.randomUUID(),
        userId: args.data.userId,
        amount: args.data.amount,
        status: args.data.status,
        authority: args.data.authority,
        refId: args.data.refId,
        transactionId: args.data.transactionId,
        paymentDate: args.data.paymentDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryDB.payments.push(newPayment);
      return newPayment;
    },
    update: async (args: any) => {
      const payment = inMemoryDB.payments.find(p => p[args.where.id]);
      if (payment) {
        Object.assign(payment, args.data);
        payment.updatedAt = new Date();
      }
      return payment;
    },
    findMany: async () => inMemoryDB.payments,
  },
  lotteryCode: {
    create: async (args: any) => {
      const newCode: LotteryCode = {
        id: crypto.randomUUID(),
        code: args.data.code,
        userId: args.data.userId,
        paymentId: args.data.paymentId,
        createdAt: new Date(),
      };
      inMemoryDB.lotteryCodes.push(newCode);
      return newCode;
    },
    count: async () => inMemoryDB.lotteryCodes.length,
    findMany: async () => inMemoryDB.lotteryCodes,
    findFirst: async (args: any) => {
      return inMemoryDB.lotteryCodes.find(c => 
        (!args.where.userId || c.userId === args.where.userId) ||
        (!args.where.paymentId || c.paymentId === args.where.paymentId)
      );
    },
  },
  lotterySettings: {
    findFirst: async () => inMemoryDB.settings,
    update: async (args: any) => {
      if (!inMemoryDB.settings) {
        inMemoryDB.settings = args.data;
        return inMemoryDB.settings;
      }
      Object.assign(inMemoryDB.settings, args.data);
      return inMemoryDB.settings;
    },
    findUnique: async () => inMemoryDB.settings,
  },
  winner: {
    create: async (args: any) => {
      const newWinner: Winner = {
        id: crypto.randomUUID(),
        userId: args.data.userId,
        lotteryCode: args.data.lotteryCode,
        drawDate: new Date(),
        createdAt: new Date(),
      };
      inMemoryDB.winners.push(newWinner);
      return newWinner;
    },
    findMany: async () => inMemoryDB.winners,
  },
  transactionLog: {
    create: async (args: any) => {
      const newLog: TransactionLog = {
        id: crypto.randomUUID(),
        userId: args.data.userId,
        action: args.data.action,
        details: args.data.details,
        ipAddress: args.data.ipAddress,
        userAgent: args.data.userAgent,
        createdAt: new Date(),
      };
      inMemoryDB.logs.push(newLog);
      return newLog;
    },
  },
  $disconnect: async () => {
    // No-op for in-memory DB
  },
};

export default db;
