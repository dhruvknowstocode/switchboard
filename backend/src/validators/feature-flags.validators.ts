import { z } from 'zod';

export const environmentKeySchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z][a-z0-9-]*$/, 'Environment key must be lowercase alphanumeric with hyphens');

export const createEnvironmentSchema = z.object({
  key: environmentKeySchema,
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
});

export const updateEnvironmentSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
});

export const flagKeySchema = z
  .string()
  .min(2)
  .max(64)
  .regex(
    /^[a-z][a-z0-9-]*$/,
    'Flag key must be lowercase alphanumeric with hyphens (e.g. new-bet-slip)',
  );

export const targetingRuleSchema = z.object({
  type: z.enum(['USER_ID', 'REGION']),
  value: z.string().min(1).max(120),
  rolloutPercentage: z.number().int().min(0).max(100),
  priority: z.number().int().min(0).max(1000).default(0),
});

export const createFeatureFlagSchema = z.object({
  key: flagKeySchema,
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  initialConfig: z
    .object({
      environment: environmentKeySchema,
      enabled: z.boolean().default(false),
      rolloutPercentage: z.number().int().min(0).max(100).default(0),
    })
    .optional(),
});

export const updateFeatureFlagSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
});

export const updateFeatureFlagConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    rolloutPercentage: z.number().int().min(0).max(100).optional(),
    targetingRules: z.array(targetingRuleSchema).optional(),
  })
  .refine(
    (data) =>
      data.enabled !== undefined ||
      data.rolloutPercentage !== undefined ||
      data.targetingRules !== undefined,
    { message: 'At least one of enabled, rolloutPercentage, or targetingRules is required' },
  );

export const evaluateBodySchema = z.object({
  userId: z.string().min(1).max(200),
  region: z.string().min(1).max(32).optional(),
  environment: environmentKeySchema,
  attributes: z.record(z.string()).optional(),
});
