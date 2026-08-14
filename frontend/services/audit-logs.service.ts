import { apiFetch } from '@/lib/api-client';
import type { Role } from '@/types';

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
}

export async function listAuditLogs(params?: {
  entityType?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  const search = new URLSearchParams();
  if (params?.entityType) search.set('entityType', params.entityType);
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  const res = await apiFetch<{ data: AuditLogEntry[] }>(
    `/audit-logs${qs ? `?${qs}` : ''}`,
  );
  return res.data;
}
