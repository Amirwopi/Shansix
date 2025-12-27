import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function assertValidDatabaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Expected a MySQL connection string like: mysql://USER:PASSWORD@HOST:3306/DBNAME'
    )
  }

  if (!url.startsWith('mysql://')) {
    throw new Error(
      `Invalid DATABASE_URL. Prisma datasource provider is "mysql" so DATABASE_URL must start with "mysql://" (received: ${url.split(':')[0] ?? 'unknown'}:)`
    )
  }
}

assertValidDatabaseUrl()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
