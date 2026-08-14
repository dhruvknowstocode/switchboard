import { createHash } from 'crypto';

/**
 * Deterministic hashing helpers for progressive rollout evaluation.
 * DO NOT use Math.random() for flag evaluation.
 *
 * TODO: Phase 3 — finalize bucket algorithm and unit tests.
 */

/**
 * Maps a stable input string to a bucket in [0, 99].
 */
export function hashToBucket(input: string): number {
  const digest = createHash('sha256').update(input).digest();
  // Use first 4 bytes as unsigned int for stable modulo
  const value = digest.readUInt32BE(0);
  return value % 100;
}

/**
 * Builds the canonical evaluation key for a user in a given flag/env.
 */
export function buildEvaluationHashKey(
  flagKey: string,
  environment: string,
  userId: string,
): string {
  return `${flagKey}:${environment}:${userId}`;
}

/**
 * Returns true if the user falls within the given rollout percentage (0–100).
 */
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
