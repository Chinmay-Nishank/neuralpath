import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

export function getPrisma(): PrismaClient | null {
  if (!isDatabaseConfigured) return null;
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return globalForPrisma.prisma;
}

