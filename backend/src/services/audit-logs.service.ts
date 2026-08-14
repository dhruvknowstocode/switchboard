import { auditLogRepository } from '../repositories/audit-log.repository.js';

/**
 * Audit logs service — read API for the dashboard.
 * Writes happen from other services (append-only).
 */
export const auditLogsService = {
  async list(filters?: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    limit?: number;
    cursor?: string;
  }) {
    return auditLogRepository.findMany(filters);
  },

  async record(data: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValue?: unknown;
    newValue?: unknown;
    metadata?: unknown;
  }) {
    return auditLogRepository.create(data);
  },
};
