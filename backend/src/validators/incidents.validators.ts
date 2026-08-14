import { z } from 'zod';

export const severitySchema = z.enum(['SEV_1', 'SEV_2', 'SEV_3', 'SEV_4']);
export const incidentStatusSchema = z.enum([
  'INVESTIGATING',
  'IDENTIFIED',
  'MONITORING',
  'RESOLVED',
]);

export const createIncidentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  severity: severitySchema,
  assignedToId: z.string().min(1).optional(),
  affectedFlagKeys: z.array(z.string().min(1)).optional(),
  affectedFlagIds: z.array(z.string().min(1)).optional(),
});

export const updateIncidentStatusSchema = z.object({
  status: incidentStatusSchema,
});

export const incidentFlagActionSchema = z.object({
  flagKey: z.string().min(1),
  environmentKey: z.string().min(1),
  reason: z.string().min(3).max(1000),
});

export const reduceRolloutSchema = z.object({
  flagKey: z.string().min(1),
  environmentKey: z.string().min(1),
  rolloutPercentage: z.number().int().min(0).max(100),
  reason: z.string().min(3).max(1000),
});

export const killSwitchBodySchema = z.object({
  environment: z.string().min(1),
  reason: z.string().min(3).max(1000),
});
