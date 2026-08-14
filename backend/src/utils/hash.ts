import { createHash } from 'crypto';

/**
 * Deterministic hashing for progressive rollout.
 * Do not use Math.random() — same user must get a stable bucket.
 */

/** Maps a stable input string to a bucket in [0, 99]. */
export function hashToBucket(input: string): number {
  const digest = createHash('sha256').update(input).digest();
  // First 4 bytes as unsigned int → stable modulo 100
  const value = digest.readUInt32BE(0);
  return value % 100;
}

/** Canonical key so the same user can land in different buckets per flag/env. */
export function buildEvaluationHashKey(
  flagKey: string,
  environment: string,
  userId: string,
): string {
  return `${flagKey}:${environment}:${userId}`;
}

/** True if the user's bucket is within the rollout percentage (0–100). */
export function isInRollout(
  flagKey: string,
  environment: string,
  userId: string,
  rolloutPercentage: number,
): boolean {
  if (rolloutPercentage <= 0) return false;
  if (rolloutPercentage >= 100) return true;
  const bucket = hashToBucket(buildEvaluationHashKey(flagKey, environment, userId));
  return bucket < rolloutPercentage;
}
