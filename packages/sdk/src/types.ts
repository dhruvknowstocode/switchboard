export type EvaluationReason =
  | 'FLAG_DISABLED'
  | 'KILLED'
  | 'TARGETING'
  | 'ROLLOUT'
  | 'DEFAULT_OFF'
  | 'NOT_FOUND';

export interface EvaluationResult {
  key: string;
  enabled: boolean;
  variant: 'on' | 'off';
  reason: EvaluationReason;
}

export interface EvaluationContext {
  userId: string;
  region?: string;
  attributes?: Record<string, string>;
}

export interface SwitchboardClientOptions {
  /** Base API URL, e.g. http://localhost:4000 */
  apiUrl: string;
  /** Machine API key (sb_live_…) */
  apiKey: string;
  /** Default environment for evaluations */
  environment: string;
  /** In-memory cache TTL in ms (default 5000) */
  cacheTtlMs?: number;
  /** Optional fetch implementation (defaults to global fetch) */
  fetch?: typeof fetch;
}

export class SwitchboardError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'SwitchboardError';
  }
}
