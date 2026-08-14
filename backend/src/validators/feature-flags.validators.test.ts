import { describe, expect, it } from 'vitest';
import {
  createFeatureFlagSchema,
  updateFeatureFlagConfigSchema,
  flagKeySchema,
} from '../validators/feature-flags.validators.js';

describe('feature flag validation', () => {
  it('accepts valid flag keys', () => {
    expect(flagKeySchema.parse('new-bet-slip')).toBe('new-bet-slip');
  });

  it('rejects invalid flag keys', () => {
    expect(() => flagKeySchema.parse('New Bet Slip')).toThrow();
    expect(() => flagKeySchema.parse('1bad')).toThrow();
  });

  it('validates create payload', () => {
    const parsed = createFeatureFlagSchema.parse({
      key: 'new-bet-slip',
      name: 'New Bet Slip',
      initialConfig: {
        environment: 'production',
        enabled: true,
        rolloutPercentage: 25,
      },
    });
    expect(parsed.initialConfig?.rolloutPercentage).toBe(25);
  });

  it('rejects invalid rollout percentages', () => {
    expect(() =>
      updateFeatureFlagConfigSchema.parse({ rolloutPercentage: -10 }),
    ).toThrow();
    expect(() =>
      updateFeatureFlagConfigSchema.parse({ rolloutPercentage: 150 }),
    ).toThrow();
    expect(() =>
      updateFeatureFlagConfigSchema.parse({ rolloutPercentage: 'hello' }),
    ).toThrow();
  });

  it('requires at least one config field', () => {
    expect(() => updateFeatureFlagConfigSchema.parse({})).toThrow();
  });
});
