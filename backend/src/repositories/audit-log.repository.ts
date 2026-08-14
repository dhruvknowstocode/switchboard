import { prisma } from '../database/prisma.js';
import type { Prisma } from '@prisma/client';

export const auditLogRepository = {
  async create(data: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValue?: unknown;
    newValue?: unknown;
    metadata?: unknown;
  }) {
    return prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        previousValue: data.previousValue as Prisma.InputJsonValue | undefined,
        newValue: data.newValue as Prisma.InputJsonValue | undefined,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  },

  async findMany(filters?: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const limit = filters?.limit ?? 50;
    return prisma.auditLog.findMany({
      where: {
        ...(filters?.entityType ? { entityType: filters.entityType } : {}),
        ...(filters?.entityId ? { entityId: filters.entityId } : {}),
        ...(filters?.actorId ? { actorId: filters.actorId } : {}),
      },
      take: limit,
      ...(filters?.cursor
        ? { skip: 1, cursor: { id: filters.cursor } }
        : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, email: true, name: true, role: true } },
      },
    });
  },
};
