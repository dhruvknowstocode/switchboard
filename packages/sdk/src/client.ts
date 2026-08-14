import type {
  EvaluationContext,
  EvaluationResult,
  SwitchboardClientOptions,
} from './types.js';
import { SwitchboardError } from './types.js';

type CacheEntry = {
  expiresAt: number;
  result: EvaluationResult;
};

/**
 * Lightweight Switchboard SDK for application runtimes.
 *
 * Flow: app → SDK → POST /api/v1/evaluate/:key → Redis/Postgres evaluation engine
 */
export class SwitchboardClient {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly environment: string;
  private readonly cacheTtlMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(options: SwitchboardClientOptions) {
    if (!options.apiUrl) throw new Error('apiUrl is required');
    if (!options.apiKey) throw new Error('apiKey is required');
    if (!options.environment) throw new Error('environment is required');

    this.apiUrl = options.apiUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.environment = options.environment;
    this.cacheTtlMs = options.cacheTtlMs ?? 5000;
    this.fetchImpl = options.fetch ?? fetch.bind(globalThis);
  }

  /** Returns whether the flag is enabled for the given user context. */
  async isEnabled(flagKey: string, context: EvaluationContext): Promise<boolean> {
    const result = await this.evaluate(flagKey, context);
    return result.enabled;
  }

  /** Full evaluation result (enabled + reason + variant). */
  async evaluate(
    flagKey: string,
    context: EvaluationContext,
  ): Promise<EvaluationResult> {
    const cacheKey = this.cacheKey(flagKey, context);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    const result = await this.fetchEvaluation(flagKey, context);
    this.cache.set(cacheKey, {
      result,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
    return result;
  }

  /** Drop cached evaluations (e.g. after an operator kill switch). */
  clearCache(): void {
    this.cache.clear();
  }

  private cacheKey(flagKey: string, context: EvaluationContext): string {
    return [
      this.environment,
      flagKey,
      context.userId,
      context.region ?? '',
      JSON.stringify(context.attributes ?? {}),
    ].join('|');
  }

  private async fetchEvaluation(
    flagKey: string,
    context: EvaluationContext,
  ): Promise<EvaluationResult> {
    const url = `${this.apiUrl}/api/v1/evaluate/${encodeURIComponent(flagKey)}`;
    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        userId: context.userId,
        region: context.region,
        environment: this.environment,
        attributes: context.attributes,
      }),
    });

    const body = (await response.json().catch(() => null)) as
      | { data?: EvaluationResult; error?: { message?: string } }
      | null;

    if (!response.ok) {
      throw new SwitchboardError(
        body?.error?.message ?? `Evaluate failed (${response.status})`,
        response.status,
        body,
      );
    }

    if (!body?.data) {
      throw new SwitchboardError('Malformed evaluate response', response.status, body);
    }

    return body.data;
  }
}
