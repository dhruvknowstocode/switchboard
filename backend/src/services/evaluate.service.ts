import type { EvaluationContext, EvaluationResult } from '../types/index.js';
import { evaluationEngine, type ResolvedFlagConfig } from './evaluation-engine.service.js';
import { featureFlagRepository } from '../repositories/feature-flag.repository.js';
import { environmentRepository } from '../repositories/environment.repository.js';
import { AppError } from '../middleware/error-handler.js';
import { getCachedFlagConfig, setCachedFlagConfig } from '../redis/flag-realtime.js';
import { logger } from '../utils/logger.js';

/**
 * Evaluate service — Redis cache → PostgreSQL → engine.
 */
export const evaluateService = {
  async evaluate(key: string, ctx: EvaluationContext): Promise<EvaluationResult> {
    const environment = await environmentRepository.findByKey(ctx.environment);
    if (!environment) {
      throw new AppError(
        404,
        'ENVIRONMENT_NOT_FOUND',
        `Environment "${ctx.environment}" not found`,
      );
    }

    const cached = await getCachedFlagConfig(ctx.environment, key);
    if (cached) {
      logger.debug('Evaluate cache hit', { key, environment: ctx.environment });
      return evaluationEngine.evaluate(cached, ctx);
    }

    const flag = await featureFlagRepository.findByKey(key);
    if (!flag) {
      throw new AppError(404, 'FLAG_NOT_FOUND', `Feature flag "${key}" not found`);
    }

    const config = await featureFlagRepository.findConfigByFlagAndEnv(key, ctx.environment);
    if (!config) {
      throw new AppError(
        404,
        'CONFIG_NOT_FOUND',
        `No configuration for flag "${key}" in environment "${ctx.environment}"`,
      );
    }

    const resolved: ResolvedFlagConfig = {
      key: flag.key,
      environment: ctx.environment,
      enabled: config.enabled,
      killed: config.killed,
      rolloutPercentage: config.rolloutPercentage,
      targetingRules: config.targetingRules.map((rule) => ({
        type: rule.type,
        value: rule.value,
        rolloutPercentage: rule.rolloutPercentage,
        priority: rule.priority,
      })),
    };

    await setCachedFlagConfig(ctx.environment, key, resolved);
    logger.debug('Evaluate cache miss — hydrated from Postgres', {
      key,
      environment: ctx.environment,
    });

    return evaluationEngine.evaluate(resolved, ctx);
  },
};
