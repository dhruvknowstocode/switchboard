import { apiFetch } from '@/lib/api-client';

export interface ApiKeyView {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdBy?: { id: string; name: string; email: string };
  /** Present only on create response */
  apiKey?: string;
}

export async function listApiKeys(): Promise<ApiKeyView[]> {
  const res = await apiFetch<{ data: ApiKeyView[] }>('/api-keys');
  return res.data;
}

export async function createApiKey(name: string): Promise<ApiKeyView> {
  const res = await apiFetch<{ data: ApiKeyView }>('/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return res.data;
}

export async function revokeApiKey(id: string): Promise<ApiKeyView> {
  const res = await apiFetch<{ data: ApiKeyView }>(`/api-keys/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return res.data;
}
