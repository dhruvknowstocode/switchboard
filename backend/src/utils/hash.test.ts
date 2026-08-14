import { describe, expect, it } from 'vitest';
import {
  buildEvaluationHashKey,
  hashToBucket,
  isInRollout,
} from '../utils/hash.js';

describe('deterministic rollout hashing', () => {
  it('maps input to a bucket between 0 and 99', () => {
    const bucket = hashToBucket('new-bet-slip:production:user-123');
    expect(bucket).toBeGreaterThanOrEqual(0);
    expect(bucket).toBeLessThan(100);
  });

  it('is deterministic for the same input', () => {
    const a = hashToBucket(buildEvaluationHashKey('new-bet-slip', 'production', 'user-123'));
    const b = hashToBucket(buildEvaluationHashKey('new-bet-slip', 'production', 'user-123'));
    expect(a).toBe(b);
  });

  it('returns false for 0% and true for 100%', () => {
    expect(isInRollout('new-bet-slip', 'production', 'user-123', 0)).toBe(false);
    expect(isInRollout('new-bet-slip', 'production', 'user-123', 100)).toBe(true);
  });

  it('keeps the same user in or out for a fixed percentage', () => {
    const first = isInRollout('new-bet-slip', 'production', 'user-123', 25);
    const second = isInRollout('new-bet-slip', 'production', 'user-123', 25);
    expect(first).toBe(second);
  });

  it('widening rollout never excludes a previously included user', () => {
    const users = Array.from({ length: 40 }, (_, i) => `user-${i}`);
    const at25 = users.filter((u) => isInRollout('flag-a', 'production', u, 25));
    const at50 = new Set(users.filter((u) => isInRollout('flag-a', 'production', u, 50)));
    for (const user of at25) {
      expect(at50.has(user)).toBe(true);
    }
  });
});
