import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function assertValidDatabaseUrl() {
  const raw = process.env.DATABASE_URL
  if (!raw) {
    throw new Error(
      'DATABASE_URL is not set. Expected a MySQL connection string like: mysql://USER:PASSWORD@HOST:3306/DBNAME'
    )
  }

  const url = raw.trim().replace(/^['"]+|['"]+$/g, '')

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
