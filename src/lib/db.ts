// Try to import Prisma client, fall back to mock
import { PrismaClient } from '@prisma/client';

let db: any;

try {
  // Try to import the generated Prisma Client
  const { PrismaClient: PrismaClientConstructor } = require('@prisma/client');
  
  const prismaClient = new PrismaClientConstructor();
  db = prismaClient;
  
  console.log('✅ Prisma Client loaded successfully');
} catch (error) {
  console.warn('⚠️  Prisma Client not found, using mock database');
  console.warn('💡 Run "bun run db:push" to fix this issue');
  
  // Import mock database
  db = require('./db-mock').default;
}

export { db };
