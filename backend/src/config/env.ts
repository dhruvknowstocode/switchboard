import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

/**
 * Centralized environment configuration.
 * All secrets and infra URLs must come from env — never hardcode.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn(
    '[config] Environment validation warnings:',
    parsed.error.flatten().fieldErrors,
  );
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment configuration');
  }
}

export const env = {
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  LOG_LEVEL: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') ?? 'info',
  DATABASE_URL:
    process.env.DATABASE_URL ??
    'postgresql://switchboard:switchboard@localhost:5432/switchboard?schema=public',
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  JWT_SECRET:
    process.env.JWT_SECRET ?? 'change-me-in-production-use-a-long-random-string',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '8h',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001',
} as const;

export type Env = typeof env;
