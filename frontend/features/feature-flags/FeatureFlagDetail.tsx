'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, TextInput, Skeleton } from '@/components/ui/Field';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFlash } from '@/hooks/useFlash';
import { FlashBanner } from '@/components/ui/FlashBanner';
import {
  evaluateFlag,
  getFeatureFlag,
  killSwitch,
  updateFeatureFlag,
  updateFlagConfig,
} from '@/services/feature-flags.service';
import { ApiError } from '@/lib/api-client';
import type { FeatureFlagConfigView, TargetingRule } from '@/types';

const ROLLOUT_PRESETS = [0, 5, 10, 25, 50, 75, 100];

export function FeatureFlagDetail({ flagKey }: { flagKey: string }) {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'RELEASE_MANAGER';
  const queryClient = useQueryClient();
  const { message, tone, flashOk, flashError } = useFlash();

  const { data: flag, isLoading, error } = useQuery({
    queryKey: ['feature-flag', flagKey],
    queryFn: () => getFeatureFlag(flagKey),
  });

  const [selectedEnv, setSelectedEnv] = useState<string>('production');
  const [evalUserId, setEvalUserId] = useState('user-123');
  const [evalRegion, setEvalRegion] = useState('AU');
  const [evalResult, setEvalResult] = useState<string | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [killReason, setKillReason] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [ruleType, setRuleType] = useState<'USER_ID' | 'REGION'>('USER_ID');
  const [ruleValue, setRuleValue] = useState('');
  const [ruleRollout, setRuleRollout] = useState(100);
  const [rulePriority, setRulePriority] = useState(10);

  const config: FeatureFlagConfigView | null = useMemo(() => {
    if (!flag?.configs.length) return null;
    return (
      flag.configs.find((c) => c.environment.key === selectedEnv) ??
      flag.configs[0] ??
      null
    );
  }, [flag, selectedEnv]);

  const mutation = useMutation({
    mutationFn: (payload: { enabled?: boolean; rolloutPercentage?: number }) =>
      updateFlagConfig(flagKey, config!.environment.key, payload),
    onSuccess: (updated, vars) => {
      queryClient.setQueryData(['feature-flag', flagKey], updated);
      void queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      void queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      if (vars.rolloutPercentage !== undefined) {
        flashOk(`Rollout set to ${vars.rolloutPercentage}% in ${config?.environment.key}`);
      } else if (vars.enabled === true) {
        flashOk('Flag enabled (kill cleared if active)');
      } else if (vars.enabled === false) {
        flashOk('Flag disabled');
      }
    },
    onError: (err) => flashError(messageFromError(err, 'Failed to update config')),
  });

  const killMutation = useMutation({
    mutationFn: () => killSwitch(flagKey, config!.environment.key, killReason),
    onSuccess: (updated) => {
      queryClient.setQueryData(['feature-flag', flagKey], updated);
      void queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      void queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      setKillReason('');
      flashOk(`Kill switch activated for ${config?.environment.key}`);
    },
    onError: (err) => flashError(messageFromError(err, 'Kill switch failed')),
  });

  const metaMutation = useMutation({
    mutationFn: () =>
      updateFeatureFlag(flagKey, {
        name: editName.trim() || undefined,
        description: editDescription.trim() ? editDescription.trim() : null,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['feature-flag', flagKey], updated);
      void queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      void queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      flashOk('Flag details updated');
    },
    onError: (err) => flashError(messageFromError(err, 'Failed to update flag')),
  });

  const targetingMutation = useMutation({
    mutationFn: (rules: TargetingRule[]) =>
      updateFlagConfig(flagKey, config!.environment.key, {
        targetingRules: rules.map((rule) => ({
          type: rule.type,
          value: rule.value,
          rolloutPercentage: rule.rolloutPercentage,
          priority: rule.priority,
        })),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['feature-flag', flagKey], updated);
      void queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      void queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      flashOk(`Targeting rules saved for ${config?.environment.key}`);
    },
    onError: (err) => flashError(messageFromError(err, 'Failed to update targeting')),
  });

  useEffect(() => {
    if (!flag) return;
    setEditName(flag.name);
    setEditDescription(flag.description ?? '');
  }, [flag]);

  async function onEvaluate() {
    setEvalError(null);
    setEvalResult(null);
    setEvaluating(true);
    try {
      const result = await evaluateFlag(flagKey, {
        userId: evalUserId,
        region: evalRegion || undefined,
        environment: config?.environment.key ?? selectedEnv,
      });
      setEvalResult(JSON.stringify(result, null, 2));
      flashOk(
        result.enabled
          ? `ON for ${evalUserId} (${result.reason})`
          : `OFF for ${evalUserId} (${result.reason})`,
      );
    } catch (err) {
      setEvalError(messageFromError(err, 'Evaluation failed'));
    } finally {
      setEvaluating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !flag) {
    return (
      <p className="text-sm text-board-danger">
        Feature flag not found or failed to load.
      </p>
    );
  }

  const activeConfig = config ?? flag.configs[0];
  const rollout = activeConfig?.rolloutPercentage ?? 0;
  const busy =
    mutation.isPending || killMutation.isPending || targetingMutation.isPending;
  const pendingRollout = mutation.isPending ? mutation.variables?.rolloutPercentage : undefined;
  const pendingEnable = mutation.isPending && mutation.variables?.enabled !== undefined;
  const currentRules = activeConfig?.targetingRules ?? [];

  function saveRules(next: TargetingRule[]) {
    targetingMutation.mutate(next);
  }

  function addRule() {
    if (!ruleValue.trim()) {
      flashError('Rule value is required');
      return;
    }
    const next: TargetingRule[] = [
      ...currentRules.map((r) => ({
        type: r.type,
        value: r.value,
        rolloutPercentage: r.rolloutPercentage,
        priority: r.priority,
      })),
      {
        type: ruleType,
        value: ruleValue.trim(),
        rolloutPercentage: ruleRollout,
        priority: rulePriority,
      },
    ];
    setRuleValue('');
    saveRules(next);
  }

  function removeRule(index: number) {
    const next = currentRules
      .filter((_, i) => i !== index)
      .map((r) => ({
        type: r.type,
        value: r.value,
        rolloutPercentage: r.rolloutPercentage,
        priority: r.priority,
      }));
    saveRules(next);
  }

  return (
    <div className="space-y-4">
      <FlashBanner message={message} tone={tone} />

      <div className="board-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-board-accent">
              Feature Flag
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{flag.name}</h2>
            <p className="mt-1 font-mono text-sm text-board-accent">{flag.key}</p>
            {canEdit ? (
              <div className="mt-3 grid max-w-xl gap-2">
                <Field label="Name">
                  <TextInput
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={metaMutation.isPending}
                  />
                </Field>
                <Field label="Description">
                  <TextInput
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    disabled={metaMutation.isPending}
                  />
                </Field>
                <Button
                  variant="ghost"
                  className="w-fit text-xs"
                  loading={metaMutation.isPending}
                  loadingText="Saving…"
                  onClick={() => metaMutation.mutate()}
                >
                  Save details
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-board-muted">
                {flag.description || 'No description'}
              </p>
            )}
            <p className="mt-2 text-[11px] text-board-muted">
              Updated by {flag.updatedBy?.name ?? flag.createdBy.name} ·{' '}
              {new Date(flag.updatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            {activeConfig?.killed ? (
              <Badge tone="danger">KILLED</Badge>
            ) : activeConfig?.enabled ? (
              <Badge tone="ok">enabled</Badge>
            ) : (
              <Badge tone="danger">disabled</Badge>
            )}
            <Badge tone="warn">
              {activeConfig?.environment.key ?? '—'} · {rollout}%
            </Badge>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {flag.configs.map((c) => {
            const active =
              (activeConfig?.environment.key ?? selectedEnv) === c.environment.key;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedEnv(c.environment.key)}
                className={`rounded border px-3 py-1.5 text-xs transition ${
                  active
                    ? 'border-board-accent bg-board-accent/15 text-white'
                    : 'border-board-border text-board-muted hover:border-board-muted hover:text-white'
                }`}
              >
                {c.environment.key} · {c.rolloutPercentage}%
                {c.killed ? ' · killed' : ''}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-board-muted">
            <span>Rollout</span>
            <span className="font-mono normal-case tracking-normal text-white">{rollout}%</span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded bg-board-border">
            <div
              className="absolute left-0 top-0 h-2.5 rounded bg-board-accent transition-all duration-300 ease-out"
              style={{ width: `${rollout}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 bg-white transition-all duration-300"
              style={{ left: `${rollout}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-board-muted">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {canEdit && activeConfig ? (
          <div className="mt-6 space-y-3">
            {activeConfig.killed ? (
              <p className="text-xs text-board-danger">
                Kill switch active{activeConfig.killReason ? `: ${activeConfig.killReason}` : ''}.
                Click Enable to clear.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeConfig.enabled && !activeConfig.killed ? 'ghost' : 'primary'}
                loading={pendingEnable}
                loadingText={
                  mutation.variables?.enabled ? 'Enabling…' : 'Disabling…'
                }
                disabled={busy && !pendingEnable}
                onClick={() =>
                  mutation.mutate({
                    enabled: !(activeConfig.enabled && !activeConfig.killed),
                  })
                }
              >
                {activeConfig.enabled && !activeConfig.killed ? 'Disable' : 'Enable'}
              </Button>
              {ROLLOUT_PRESETS.map((pct) => (
                <Button
                  key={pct}
                  variant={rollout === pct ? 'primary' : 'ghost'}
                  className="min-w-[3.25rem] text-xs"
                  loading={pendingRollout === pct}
                  loadingText={`${pct}%`}
                  disabled={busy || activeConfig.killed}
                  onClick={() => mutation.mutate({ rolloutPercentage: pct })}
                >
                  {pct}%
                </Button>
              ))}
            </div>

            <div className="space-y-2 rounded-xl border border-board-danger/40 bg-board-danger/5 p-4 shadow-glow-danger">
              <div className="text-xs font-medium text-board-danger">Emergency Kill Switch</div>
              <TextInput
                placeholder="Reason required — e.g. Payment latency spike"
                value={killReason}
                onChange={(e) => setKillReason(e.target.value)}
                disabled={killMutation.isPending}
              />
              <Button
                variant="danger"
                loading={killMutation.isPending}
                loadingText="Activating…"
                disabled={busy || killReason.trim().length < 3}
                onClick={() => killMutation.mutate()}
              >
                Activate Kill Switch
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="board-card p-4">
          <h3 className="mb-2 text-sm font-medium">Targeting Rules</h3>
          <p className="mb-3 text-xs text-board-muted">
            Rules override global rollout for matching users/regions (higher priority first).
          </p>
          {!currentRules.length ? (
            <p className="mb-3 text-sm text-board-muted">
              No targeting rules for this environment yet.
            </p>
          ) : (
            <ul className="mb-3 space-y-2 text-sm">
              {currentRules.map((rule, index) => (
                <li
                  key={`${rule.type}-${rule.value}-${rule.priority}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-board-border px-3 py-2"
                >
                  <span className="font-mono text-xs">
                    {rule.type}={rule.value} · {rule.rolloutPercentage}% · priority{' '}
                    {rule.priority}
                  </span>
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      className="text-xs"
                      disabled={targetingMutation.isPending}
                      onClick={() => removeRule(index)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {canEdit ? (
            <div className="space-y-2 rounded-xl border border-board-border/80 bg-board-elevated/40 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Type">
                  <select
                    className="board-input"
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value as 'USER_ID' | 'REGION')}
                  >
                    <option value="USER_ID">USER_ID</option>
                    <option value="REGION">REGION</option>
                  </select>
                </Field>
                <Field label="Value">
                  <TextInput
                    value={ruleValue}
                    onChange={(e) => setRuleValue(e.target.value)}
                    placeholder={ruleType === 'REGION' ? 'AU' : 'user-123'}
                  />
                </Field>
                <Field label="Rollout %">
                  <TextInput
                    type="number"
                    min={0}
                    max={100}
                    value={ruleRollout}
                    onChange={(e) => setRuleRollout(Number(e.target.value))}
                  />
                </Field>
                <Field label="Priority">
                  <TextInput
                    type="number"
                    min={0}
                    max={1000}
                    value={rulePriority}
                    onChange={(e) => setRulePriority(Number(e.target.value))}
                  />
                </Field>
              </div>
              <Button
                loading={targetingMutation.isPending}
                loadingText="Saving…"
                disabled={busy}
                onClick={addRule}
              >
                Add rule
              </Button>
            </div>
          ) : null}
        </section>

        <section className="board-card space-y-3 p-4">
          <h3 className="text-sm font-medium">Evaluation Preview</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="User ID">
              <TextInput
                value={evalUserId}
                onChange={(e) => setEvalUserId(e.target.value)}
                disabled={evaluating}
              />
            </Field>
            <Field label="Region">
              <TextInput
                value={evalRegion}
                onChange={(e) => setEvalRegion(e.target.value)}
                disabled={evaluating}
              />
            </Field>
          </div>
          <Button
            onClick={() => void onEvaluate()}
            loading={evaluating}
            loadingText="Evaluating…"
            disabled={!evalUserId.trim()}
          >
            Evaluate
          </Button>
          {evalError ? <p className="text-xs text-board-danger">{evalError}</p> : null}
          {evalResult ? (
            <pre className="animate-in overflow-auto rounded border border-board-border bg-board-bg p-3 font-mono text-[11px] text-board-muted">
              {evalResult}
            </pre>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function messageFromError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { error?: { message?: string } } | undefined;
    return body?.error?.message ?? fallback;
  }
  return fallback;
}
