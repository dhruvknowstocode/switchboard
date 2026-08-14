import { prisma } from '../database/prisma.js';
import type { IncidentStatus, Prisma, Severity } from '@prisma/client';

const incidentInclude = {
  createdBy: { select: { id: true, email: true, name: true, role: true } },
  assignedTo: { select: { id: true, email: true, name: true, role: true } },
  affectedFlags: {
    include: {
      featureFlag: {
        select: { id: true, key: true, name: true },
      },
    },
  },
  events: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      actor: { select: { id: true, email: true, name: true, role: true } },
    },
  },
} satisfies Prisma.IncidentInclude;

export type IncidentWithRelations = Prisma.IncidentGetPayload<{
  include: typeof incidentInclude;
}>;

export const incidentRepository = {
  async findAll(filters?: { status?: IncidentStatus; severity?: Severity }) {
    return prisma.incident.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.severity ? { severity: filters.severity } : {}),
      },
      include: incidentInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.incident.findUnique({
      where: { id },
      include: incidentInclude,
    });
  },

  async findByNumber(number: string) {
    return prisma.incident.findUnique({
      where: { number },
      include: incidentInclude,
    });
  },

  async findByIdOrNumber(idOrNumber: string) {
    if (idOrNumber.startsWith('INC-')) {
      return this.findByNumber(idOrNumber);
    }
    const byId = await this.findById(idOrNumber);
    if (byId) return byId;
    return this.findByNumber(idOrNumber);
  },

  async nextNumber(): Promise<string> {
    const count = await prisma.incident.count();
    return `INC-${1001 + count}`;
  },

  async create(data: {
    number: string;
    title: string;
    description?: string | null;
    severity: Severity;
    createdById: string;
    assignedToId?: string | null;
    affectedFlagIds?: string[];
  }) {
    return prisma.incident.create({
      data: {
        number: data.number,
        title: data.title,
        description: data.description,
        severity: data.severity,
        createdById: data.createdById,
        assignedToId: data.assignedToId ?? null,
        affectedFlags: data.affectedFlagIds?.length
          ? {
              create: data.affectedFlagIds.map((featureFlagId) => ({ featureFlagId })),
            }
          : undefined,
        events: {
          create: {
            type: 'CREATED',
            message: `Incident ${data.number} created: ${data.title}`,
            actorId: data.createdById,
            metadata: { severity: data.severity },
          },
        },
      },
      include: incidentInclude,
    });
  },

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      severity: Severity;
      status: IncidentStatus;
      assignedToId: string | null;
      resolvedAt: Date | null;
    }>,
  ) {
    return prisma.incident.update({
      where: { id },
      data,
      include: incidentInclude,
    });
  },

  async addEvent(
    incidentId: string,
    data: {
      type: string;
      message: string;
      actorId: string;
      metadata?: unknown;
    },
  ) {
    await prisma.incidentEvent.create({
      data: {
        incidentId,
        type: data.type,
        message: data.message,
        actorId: data.actorId,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    return this.findById(incidentId);
  },

  async addAffectedFlag(incidentId: string, featureFlagId: string) {
    await prisma.incidentAffectedFlag.upsert({
      where: {
        incidentId_featureFlagId: { incidentId, featureFlagId },
      },
      create: { incidentId, featureFlagId },
      update: {},
    });
    return this.findById(incidentId);
  },
};
