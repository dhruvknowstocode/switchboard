import type { TargetingType } from '@prisma/client';
import { featureFlagRepository } from '../repositories/feature-flag.repository.js';
import { environmentRepository } from '../repositories/environment.repository.js';
import { auditLogRepository } from '../repositories/audit-log.repository.js';
import { AppError } from '../middleware/error-handler.js';
import {
  invalidateFlagCache,
  publishFeatureFlagEvent,
} from '../redis/flag-realtime.js';

function serializeFlag(flag: Awaited<ReturnType<typeof featureFlagRepository.findByKey>>) {
  if (!flag) return null;
  return {
    id: flag.id,
    key: flag.key,
    name: flag.name,
    description: flag.description,
    createdAt: flag.createdAt,
    updatedAt: flag.updatedAt,
    createdBy: flag.createdBy,
    updatedBy: flag.updatedBy,
    configs: flag.configs.map((config) => ({
      id: config.id,
      enabled: config.enabled,
      rolloutPercentage: config.rolloutPercentage,
      killed: config.killed,
      killReason: config.killReason,
      environment: {
        id: config.environment.id,
        key: config.environment.key,
        name: config.environment.name,
      },
      targetingRules: config.targetingRules.map((rule) => ({
        id: rule.id,
        type: rule.type,
        value: rule.value,
        rolloutPercentage: rule.rolloutPercentage,
        priority: rule.priority,
      })),
      updatedAt: config.updatedAt,
    })),
  };
}

export const featureFlagsService = {
  async list() {
    const flags = await featureFlagRepository.findAll();
    return flags.map((flag) => serializeFlag(flag));
  },

  async getByKey(key: string) {
    const flag = await featureFlagRepository.findByKey(key);
    if (!flag) {
      throw new AppError(404, 'FLAG_NOT_FOUND', `Feature flag "${key}" not found`);
    }
    return serializeFlag(flag);
  },

  async create(data: {
    key: string;
    name: string;
    description?: string;
    createdById: string;
    initialConfig?: {
      environment: string;
      enabled: boolean;
      rolloutPercentage: number;
    };
  }) {
    const existing = await featureFlagRepository.findByKey(data.key);
    if (existing) {
      throw new AppError(409, 'FLAG_EXISTS', `Feature flag "${data.key}" already exists`);
    }

    const flag = await featureFlagRepository.create({
      key: data.key,
      name: data.name,
      description: data.description,
      createdById: data.createdById,
    });

    const environments = await environmentRepository.findAll();
    await featureFlagRepository.createDefaultConfigs(
      flag.id,
      environments.map((env) => env.id),
    );

    if (data.initialConfig) {
      const env = await environmentRepository.findByKey(data.initialConfig.environment);
      if (!env) {
        throw new AppError(
          404,
          'ENVIRONMENT_NOT_FOUND',
          `Environment "${data.initialConfig.environment}" not found`,
        );
      }
      await featureFlagRepository.upsertConfig({
        featureFlagId: flag.id,
        environmentId: env.id,
        enabled: data.initialConfig.enabled,
        rolloutPercentage: data.initialConfig.rolloutPercentage,
      });
    }

    const full = await featureFlagRepository.findByKey(data.key);
    await auditLogRepository.create({
      actorId: data.createdById,
      action: 'CREATE_FLAG',
      entityType: 'FeatureFlag',
      entityId: flag.id,
      newValue: serializeFlag(full),
    });

    await invalidateFlagCache(data.key);
    await publishFeatureFlagEvent('FEATURE_FLAG_CREATED', {
      flagKey: data.key,
      environment: data.initialConfig?.environment ?? 'all',
      enabled: data.initialConfig?.enabled,
      rolloutPercentage: data.initialConfig?.rolloutPercentage,
      name: data.name,
    });

    return serializeFlag(full);
  },

  async update(
    key: string,
    data: Partial<{ name: string; description: string | null; updatedById: string }>,
  ) {
    const existing = await featureFlagRepository.findByKey(key);
    if (!existing) {
      throw new AppError(404, 'FLAG_NOT_FOUND', `Feature flag "${key}" not found`);
    }

    const updated = await featureFlagRepository.update(key, {
      name: data.name,
      description: data.description,
      updatedById: data.updatedById,
    });

    await auditLogRepository.create({
      actorId: data.updatedById ?? existing.createdById,
      action: 'UPDATE_FLAG',
      entityType: 'FeatureFlag',
      entityId: existing.id,
      previousValue: serializeFlag(existing),
      newValue: serializeFlag(updated),
    });

    await invalidateFlagCache(key);
    await publishFeatureFlagEvent('FEATURE_FLAG_UPDATED', {
      flagKey: key,
      environment: 'all',
      name: updated.name,
    });

    return serializeFlag(updated);
  },

  async updateConfig(
    key: string,
    environmentKey: string,
    data: {
      enabled?: boolean;
      rolloutPercentage?: number;
      targetingRules?: Array<{
        type: TargetingType;
        value: string;
        rolloutPercentage: number;
        priority: number;
      }>;
      updatedById: string;
    },
  ) {
    const flag = await featureFlagRepository.findByKey(key);
    if (!flag) {
      throw new AppError(404, 'FLAG_NOT_FOUND', `Feature flag "${key}" not found`);
    }

    const environment = await environmentRepository.findByKey(environmentKey);
    if (!environment) {
      throw new AppError(
        404,
        'ENVIRONMENT_NOT_FOUND',
        `Environment "${environmentKey}" not found`,
      );
    }

    const previous = flag.configs.find((c) => c.environment.key === environmentKey) ?? null;

    const config = await featureFlagRepository.upsertConfig({
      featureFlagId: flag.id,
      environmentId: environment.id,
      enabled: data.enabled,
      rolloutPercentage: data.rolloutPercentage,
      // Re-enabling clears emergency kill state
      ...(data.enabled === true ? { killed: false, killReason: null } : {}),
    });

    if (data.targetingRules) {
      await featureFlagRepository.replaceTargetingRules(config.id, data.targetingRules);
    }

    await featureFlagRepository.update(key, { updatedById: data.updatedById });
    const refreshed = await featureFlagRepository.findByKey(key);
    const nextConfig = refreshed?.configs.find((c) => c.environment.key === environmentKey);

    const actions: string[] = [];
    if (data.rolloutPercentage !== undefined) actions.push('UPDATE_ROLLOUT');
    if (data.enabled === true) actions.push('ENABLE_FLAG');
    if (data.enabled === false) actions.push('DISABLE_FLAG');
    if (data.targetingRules !== undefined) actions.push('UPDATE_TARGETING');
    if (actions.length === 0) actions.push('UPDATE_CONFIG');

    for (const action of actions) {
      await auditLogRepository.create({
        actorId: data.updatedById,
        action,
        entityType: 'FeatureFlagConfig',
        entityId: config.id,
        previousValue: previous,
        newValue: nextConfig,
        metadata: { flagKey: key, environment: environmentKey },
      });
    }

    await invalidateFlagCache(key, [environmentKey]);
    await publishFeatureFlagEvent('FEATURE_FLAG_UPDATED', {
      flagKey: key,
      environment: environmentKey,
      enabled: nextConfig?.enabled,
      rolloutPercentage: nextConfig?.rolloutPercentage,
      killed: nextConfig?.killed,
      name: flag.name,
    });

    return serializeFlag(refreshed);
  },

  async remove(key: string, actorId: string) {
    const existing = await featureFlagRepository.findByKey(key);
    if (!existing) {
      throw new AppError(404, 'FLAG_NOT_FOUND', `Feature flag "${key}" not found`);
    }

    const envKeys = existing.configs.map((c) => c.environment.key);
    await featureFlagRepository.delete(key);
    await auditLogRepository.create({
      actorId,
      action: 'DELETE_FLAG',
      entityType: 'FeatureFlag',
      entityId: existing.id,
      previousValue: serializeFlag(existing),
    });

    await invalidateFlagCache(key, envKeys);
    await publishFeatureFlagEvent('FEATURE_FLAG_UPDATED', {
      flagKey: key,
      environment: 'all',
      deleted: true,
      name: existing.name,
    });
  },

  /**
   * Emergency kill switch — disables flag, sets rollout 0, marks killed + reason.
   */
  async killSwitch(
    key: string,
    environmentKey: string,
    data: { reason: string; actorId: string },
  ) {
    const reason = data.reason.trim();
    if (reason.length < 3) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Kill switch requires a reason');
    }

    const flag = await featureFlagRepository.findByKey(key);
    if (!flag) {
      throw new AppError(404, 'FLAG_NOT_FOUND', `Feature flag "${key}" not found`);
    }

    const environment = await environmentRepository.findByKey(environmentKey);
    if (!environment) {
      throw new AppError(
        404,
        'ENVIRONMENT_NOT_FOUND',
        `Environment "${environmentKey}" not found`,
      );
    }

    const previous = flag.configs.find((c) => c.environment.key === environmentKey) ?? null;

    const config = await featureFlagRepository.upsertConfig({
      featureFlagId: flag.id,
      environmentId: environment.id,
      enabled: false,
      rolloutPercentage: 0,
      killed: true,
      killReason: reason,
    });

    await featureFlagRepository.update(key, { updatedById: data.actorId });
    const refreshed = await featureFlagRepository.findByKey(key);
    const nextConfig = refreshed?.configs.find((c) => c.environment.key === environmentKey);

    await auditLogRepository.create({
      actorId: data.actorId,
      action: 'KILL_SWITCH',
      entityType: 'FeatureFlagConfig',
      entityId: config.id,
      previousValue: previous,
      newValue: nextConfig,
      metadata: { flagKey: key, environment: environmentKey, reason },
    });

    await invalidateFlagCache(key, [environmentKey]);
    await publishFeatureFlagEvent('FEATURE_FLAG_KILLED', {
      flagKey: key,
      environment: environmentKey,
      enabled: false,
      rolloutPercentage: 0,
      killed: true,
      name: flag.name,
    });

    return serializeFlag(refreshed);
  },
};
