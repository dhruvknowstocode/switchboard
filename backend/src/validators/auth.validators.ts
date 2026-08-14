import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(120),
  role: z
    .enum(['ADMIN', 'RELEASE_MANAGER', 'DEVELOPER', 'VIEWER'])
    .optional()
    .default('DEVELOPER'),
});

export const updateRoleBodySchema = z.object({
  role: z.enum(['ADMIN', 'RELEASE_MANAGER', 'DEVELOPER', 'VIEWER']),
});
