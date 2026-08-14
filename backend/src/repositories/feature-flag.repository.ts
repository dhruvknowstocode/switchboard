import { prisma } from '../database/prisma.js';
import type { Prisma, TargetingType } from '@prisma/client';

const flagInclude = {
  createdBy: { select: { id: true, email: true, name: true, role: true } },
  updatedBy: { select: { id: true, email: true, name: true, role: true } },
  configs: {
    include: {
      environment: true,
      targetingRules: { orderBy: { priority: 'desc' as const } },
    },
    orderBy: { environment: { key: 'asc' as const } },
  },
} satisfies Prisma.FeatureFlagInclude;

export type FeatureFlagWithRelations = Prisma.FeatureFlagGetPayload<{
  include: typeof flagInclude;
}>;

export const featureFlagRepository = {
  async findAll(): Promise<FeatureFlagWithRelations[]> {
    return prisma.featureFlag.findMany({
      include: flagInclude,
      orderBy: { updatedAt: 'desc' },
    });
  },

  async findByKey(key: string): Promise<FeatureFlagWithRelations | null> {
    return prisma.featureFlag.findUnique({
      where: { key },
      include: flagInclude,
    });
  },

  async findConfigByFlagAndEnv(flagKey: string, environmentKey: string) {
    return prisma.featureFlagConfig.findFirst({
      where: {
        featureFlag: { key: flagKey },
        environment: { key: environmentKey },
      },
      include: {
        featureFlag: true,
        environment: true,
        targetingRules: { orderBy: { priority: 'desc' } },
      },
    });
  },

  async create(data: {
    key: string;
    name: string;
    description?: string | null;
    createdById: string;
  }) {
    return prisma.featureFlag.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        createdById: data.createdById,
        updatedById: data.createdById,
      },
      include: flagInclude,
    });
  },

  async update(
    key: string,
    data: Partial<{ name: string; description: string | null; updatedById: string }>,
  ) {
    return prisma.featureFlag.update({
      where: { key },
      data,
      include: flagInclude,
    });
  },

  async delete(key: string) {
    return prisma.featureFlag.delete({ where: { key } });
  },

  async createDefaultConfigs(featureFlagId: string, environmentIds: string[]) {
    if (environmentIds.length === 0) return [];
    await prisma.featureFlagConfig.createMany({
      data: environmentIds.map((environmentId) => ({
        featureFlagId,
        environmentId,
        enabled: false,
        rolloutPercentage: 0,
      })),
      skipDuplicates: true,
    });
    return prisma.featureFlagConfig.findMany({
      where: { featureFlagId },
      include: {
        environment: true,
        targetingRules: true,
      },
    });
  },

  async upsertConfig(params: {
    featureFlagId: string;
    environmentId: string;
    enabled?: boolean;
    rolloutPercentage?: number;
    killed?: boolean;
    killReason?: string | null;
  }) {
    return prisma.featureFlagConfig.upsert({
      where: {
        featureFlagId_environmentId: {
          featureFlagId: params.featureFlagId,
          environmentId: params.environmentId,
        },
      },
      create: {
        featureFlagId: params.featureFlagId,
        environmentId: params.environmentId,
        enabled: params.enabled ?? false,
        rolloutPercentage: params.rolloutPercentage ?? 0,
        killed: params.killed ?? false,
        killReason: params.killReason ?? null,
      },
      update: {
        ...(params.enabled !== undefined ? { enabled: params.enabled } : {}),
        ...(params.rolloutPercentage !== undefined
          ? { rolloutPercentage: params.rolloutPercentage }
          : {}),
        ...(params.killed !== undefined ? { killed: params.killed } : {}),
        ...(params.killReason !== undefined ? { killReason: params.killReason } : {}),
      },
      include: {
        environment: true,
        targetingRules: { orderBy: { priority: 'desc' } },
        featureFlag: true,
      },
    });
  },

  async replaceTargetingRules(
    configId: string,
    rules: Array<{
      type: TargetingType;
      value: string;
      rolloutPercentage: number;
      priority: number;
    }>,
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.targetingRule.deleteMany({ where: { configId } });
      if (rules.length > 0) {
        await tx.targetingRule.createMany({
          data: rules.map((rule) => ({
            configId,
            type: rule.type,
            value: rule.value,
            rolloutPercentage: rule.rolloutPercentage,
            priority: rule.priority,
          })),
        });
      }
    });

    return prisma.targetingRule.findMany({
      where: { configId },
      orderBy: { priority: 'desc' },
    });
  },
};
