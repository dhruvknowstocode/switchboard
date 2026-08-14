import { describe, expect, it } from 'vitest';
import { evaluationEngine } from '../services/evaluation-engine.service.js';

const baseConfig = {
  key: 'new-bet-slip',
  environment: 'production',
  enabled: true,
  killed: false,
  rolloutPercentage: 0,
  targetingRules: [] as Array<{
    type: 'USER_ID' | 'REGION';
    value: string;
    rolloutPercentage: number;
    priority: number;
  }>,
};

describe('evaluationEngine', () => {
  it('returns FLAG_DISABLED when flag is disabled', () => {
    const result = evaluationEngine.evaluate(
      { ...baseConfig, enabled: false, rolloutPercentage: 100 },
      { userId: 'user-1', environment: 'production' },
    );
    expect(result).toMatchObject({
      enabled: false,
      variant: 'off',
      reason: 'FLAG_DISABLED',
    });
  });

  it('returns KILLED when kill switch is active', () => {
    const result = evaluationEngine.evaluate(
      { ...baseConfig, enabled: true, killed: true, rolloutPercentage: 100 },
      { userId: 'user-1', environment: 'production' },
    );
    expect(result.reason).toBe('KILLED');
    expect(result.enabled).toBe(false);
  });

  it('applies user targeting before global rollout', () => {
    const result = evaluationEngine.evaluate(
      {
        ...baseConfig,
        rolloutPercentage: 0,
        targetingRules: [
          {
            type: 'USER_ID',
            value: 'beta-user',
            rolloutPercentage: 100,
            priority: 10,
          },
        ],
      },
      { userId: 'beta-user', environment: 'production' },
    );
    expect(result.enabled).toBe(true);
    expect(result.reason).toBe('TARGETING');
  });

  it('applies region targeting', () => {
    const result = evaluationEngine.evaluate(
      {
        ...baseConfig,
        rolloutPercentage: 0,
        targetingRules: [
          {
            type: 'REGION',
            value: 'AU',
            rolloutPercentage: 100,
            priority: 5,
          },
        ],
      },
      { userId: 'user-1', region: 'AU', environment: 'production' },
    );
    expect(result.enabled).toBe(true);
    expect(result.reason).toBe('TARGETING');
  });

  it('returns ROLLOUT or DEFAULT_OFF for global percentage', () => {
    const on = evaluationEngine.evaluate(
      { ...baseConfig, rolloutPercentage: 100 },
      { userId: 'user-1', environment: 'production' },
    );
    expect(on.enabled).toBe(true);
    expect(on.reason).toBe('ROLLOUT');

    const off = evaluationEngine.evaluate(
      { ...baseConfig, rolloutPercentage: 0 },
      { userId: 'user-1', environment: 'production' },
    );
    expect(off.enabled).toBe(false);
    expect(off.reason).toBe('DEFAULT_OFF');
  });
});
