import { apiFetch } from '@/lib/api-client';
import type { Environment } from '@/types';

export async function listEnvironments() {
  const res = await apiFetch<{ data: Environment[] }>('/environments');
  return res.data;
}

export async function createEnvironment(payload: {
  key: string;
  name: string;
  description?: string;
}) {
  const res = await apiFetch<{ data: Environment }>('/environments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}
