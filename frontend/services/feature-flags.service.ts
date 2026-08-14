import { apiFetch } from '@/lib/api-client';
import type { FeatureFlag, EvaluationResult } from '@/types';

export async function listFeatureFlags() {
  const res = await apiFetch<{ data: FeatureFlag[] }>('/feature-flags');
  return res.data;
}

export async function getFeatureFlag(flagKey: string) {
  const res = await apiFetch<{ data: FeatureFlag }>(
    `/feature-flags/${encodeURIComponent(flagKey)}`,
  );
  return res.data;
}

export async function createFeatureFlag(payload: {
  key: string;
  name: string;
  description?: string;
  initialConfig?: {
    environment: string;
    enabled: boolean;
    rolloutPercentage: number;
  };
}) {
  const res = await apiFetch<{ data: FeatureFlag }>('/feature-flags', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateFeatureFlag(
  flagKey: string,
  payload: { name?: string; description?: string | null },
) {
  const res = await apiFetch<{ data: FeatureFlag }>(
    `/feature-flags/${encodeURIComponent(flagKey)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
  return res.data;
}

export async function updateFlagConfig(
  flagKey: string,
  environment: string,
  payload: {
    enabled?: boolean;
    rolloutPercentage?: number;
    targetingRules?: Array<{
      type: 'USER_ID' | 'REGION';
      value: string;
      rolloutPercentage: number;
      priority: number;
    }>;
  },
) {
  const res = await apiFetch<{ data: FeatureFlag }>(
    `/feature-flags/${encodeURIComponent(flagKey)}/configs/${encodeURIComponent(environment)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
  return res.data;
}

export async function evaluateFlag(
  flagKey: string,
  payload: { userId: string; region?: string; environment: string },
) {
  const res = await apiFetch<{ data: EvaluationResult }>(
    `/evaluate/${encodeURIComponent(flagKey)}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return res.data;
}

export async function killSwitch(flagKey: string, environment: string, reason: string) {
  const res = await apiFetch<{ data: FeatureFlag }>(
    `/feature-flags/${encodeURIComponent(flagKey)}/kill`,
    {
      method: 'POST',
      body: JSON.stringify({ environment, reason }),
    },
  );
  return res.data;
}
