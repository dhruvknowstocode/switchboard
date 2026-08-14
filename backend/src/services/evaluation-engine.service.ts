import type { EvaluationContext, EvaluationResult } from '../types/index.js';
import { isInRollout } from '../utils/hash.js';

/**
 * Isolated deterministic evaluation engine.
 * No I/O — pure decision logic given a resolved flag config + context.
 */
export interface ResolvedFlagConfig {
  key: string;
  environment: string;
  enabled: boolean;
  killed: boolean;
  rolloutPercentage: number;
  targetingRules: Array<{
    type: 'USER_ID' | 'REGION';
    value: string;
    rolloutPercentage: number;
    priority: number;
  }>;
}

export const evaluationEngine = {
  evaluate(config: ResolvedFlagConfig, ctx: EvaluationContext): EvaluationResult {
    if (config.killed) {
      return { key: config.key, enabled: false, variant: 'off', reason: 'KILLED' };
    }

    if (!config.enabled) {
      return {
        key: config.key,
        enabled: false,
        variant: 'off',
        reason: 'FLAG_DISABLED',
      };
    }

    const rules = [...config.targetingRules].sort((a, b) => b.priority - a.priority);

    for (const rule of rules) {
      if (rule.type === 'USER_ID' && rule.value === ctx.userId) {
        const enabled = isInRollout(
          config.key,
          config.environment,
          ctx.userId,
          rule.rolloutPercentage,
        );
        return {
          key: config.key,
          enabled,
          variant: enabled ? 'on' : 'off',
          reason: 'TARGETING',
        };
      }

      if (rule.type === 'REGION' && ctx.region && rule.value === ctx.region) {
        const enabled = isInRollout(
          config.key,
          config.environment,
          ctx.userId,
          rule.rolloutPercentage,
        );
        return {
          key: config.key,
          enabled,
          variant: enabled ? 'on' : 'off',
          reason: 'TARGETING',
        };
      }
    }

    const enabled = isInRollout(
      config.key,
      config.environment,
      ctx.userId,
      config.rolloutPercentage,
    );

    return {
      key: config.key,
      enabled,
      variant: enabled ? 'on' : 'off',
      reason: enabled ? 'ROLLOUT' : 'DEFAULT_OFF',
    };
  },
};
