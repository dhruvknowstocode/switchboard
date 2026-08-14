import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

/** Shared Prisma client singleton. */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('PostgreSQL health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
