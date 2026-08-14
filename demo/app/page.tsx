'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SwitchboardClient, type EvaluationResult } from '@switchboard/sdk';

const FLAG_HERO = 'folio-hero-v2';
const FLAG_AUDIO = 'folio-audio-mode';
const FLAG_GATE = 'folio-member-gate';

const USERS = [
  { id: 'user-1', label: 'user-1 (often in early buckets)' },
  { id: 'user-12', label: 'user-12 (often later buckets)' },
  { id: 'reader-ava', label: 'reader-ava' },
  { id: 'reader-noah', label: 'reader-noah' },
];

const ENVIRONMENTS = ['development', 'staging', 'production'] as const;

type FlagMap = Record<string, EvaluationResult | null>;

function createClient(environment: string) {
  return new SwitchboardClient({
    apiUrl: process.env.NEXT_PUBLIC_SWITCHBOARD_API_URL ?? 'http://localhost:4000',
    apiKey:
      process.env.NEXT_PUBLIC_SWITCHBOARD_API_KEY ??
      'sb_live_folio_demo_key_local_only_0001',
    environment,
    cacheTtlMs: 2000,
  });
}

export default function FolioHomePage() {
  const [environment, setEnvironment] = useState<string>(
    process.env.NEXT_PUBLIC_SWITCHBOARD_ENV ?? 'production',
  );
  const client = useMemo(() => createClient(environment), [environment]);
  const [userId, setUserId] = useState(USERS[0].id);
  const [region, setRegion] = useState('US');
  const [flags, setFlags] = useState<FlagMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    client.clearCache();
    try {
      const keys = [FLAG_HERO, FLAG_AUDIO, FLAG_GATE];
      const results = await Promise.all(
        keys.map(async (key) => {
          const result = await client.evaluate(key, { userId, region });
          return [key, result] as const;
        }),
      );
      setFlags(Object.fromEntries(results));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate flags');
    } finally {
      setLoading(false);
    }
  }, [client, region, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const heroV2 = flags[FLAG_HERO]?.enabled ?? false;
  const audio = flags[FLAG_AUDIO]?.enabled ?? false;
  const memberGate = flags[FLAG_GATE]?.enabled ?? false;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          Folio <span>Magazine</span>
        </div>
        <div className="controls">
          <span className="pill">Powered by Switchboard SDK</span>
          <label>
            Env{' '}
            <select value={environment} onChange={(e) => setEnvironment(e.target.value)}>
              {ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>
          </label>
          <label>
            Reader{' '}
            <select value={userId} onChange={(e) => setUserId(e.target.value)}>
              {USERS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Region{' '}
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="US">US</option>
              <option value="AU">AU</option>
              <option value="IN">IN</option>
            </select>
          </label>
          <button type="button" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'Evaluating…' : 'Re-evaluate'}
          </button>
        </div>
      </header>

      {error ? (
        <p className="error">
          {error}. Is the Switchboard API running on :4000? Did you seed the Folio API key?
        </p>
      ) : null}

      <section className={`hero ${heroV2 ? 'hero-v2' : 'hero-classic'}`}>
        {heroV2 ? (
          <>
            <div className="copy">
              <div className="eyebrow">Weekend long read · Hero V2</div>
              <h1>Cities that remember the tide</h1>
              <p className="lede">
                A dispatch from coastal archives — how harbors keep time better than clocks.
              </p>
              <div className="actions">
                <button type="button" className="btn">
                  Read story
                </button>
                {audio ? (
                  <button type="button" className="btn audio">
                    Listen · 12 min
                  </button>
                ) : null}
              </div>
            </div>
            <div className="art">
              <div className="eyebrow" style={{ color: '#b7d7d0' }}>
                Folio Issue 48
              </div>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', margin: 0, fontSize: '1.8rem' }}>
                Designed by flags, not deploys
              </h2>
            </div>
          </>
        ) : (
          <div>
            <div className="eyebrow">Classic layout · Hero V1</div>
            <h1>Cities that remember the tide</h1>
            <p className="lede">
              A dispatch from coastal archives — how harbors keep time better than clocks.
            </p>
            <div className="actions">
              <button type="button" className="btn">
                Read story
              </button>
              {audio ? (
                <button type="button" className="btn audio">
                  Listen · 12 min
                </button>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <div className="grid">
        <article className="card">
          <h2>From the editor</h2>
          <p>
            This page is a consumer app. It never talks to Postgres or Redis directly — it asks
            Switchboard whether each feature is on for the selected reader.
          </p>
          {memberGate ? (
            <div className="gate">
              <strong>Members continue below.</strong> Soft paywall is ON for this reader
              (`folio-member-gate`). Kill it from Switchboard to remove this CTA instantly.
            </div>
          ) : (
            <p style={{ marginTop: 16 }}>
              Member gate is off for this reader — full story unlocked.
            </p>
          )}
        </article>

        <aside className="card">
          <h2>Live evaluations</h2>
          <p>Results for `{userId}` in `{environment}`.</p>
          <div className="flags">
            {[FLAG_HERO, FLAG_AUDIO, FLAG_GATE].map((key) => {
              const result = flags[key];
              return (
                <div className="flag-row" key={key}>
                  <code>{key}</code>
                  <span className={result?.enabled ? 'on' : 'off'}>
                    {result
                      ? `${result.enabled ? 'ON' : 'OFF'} · ${result.reason}`
                      : loading
                        ? '…'
                        : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      <p className="hint">
        Open Switchboard (`localhost:3000`), change rollout / kill switch / targeting on{' '}
        <code>folio-hero-v2</code>, <code>folio-audio-mode</code>, or{' '}
        <code>folio-member-gate</code>, then hit <strong>Re-evaluate</strong> here. Use the{' '}
        <strong>Env</strong> dropdown to compare development / staging / production. Same reader
        keeps a stable bucket — different readers can differ at the same %.
      </p>
    </main>
  );
}
