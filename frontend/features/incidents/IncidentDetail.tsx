'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, TextInput, TextSelect, Skeleton } from '@/components/ui/Field';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFlash } from '@/hooks/useFlash';
import { FlashBanner } from '@/components/ui/FlashBanner';
import {
  getIncident,
  killFlagFromIncident,
  reduceRolloutFromIncident,
  updateIncidentStatus,
} from '@/services/incidents.service';
import { ApiError } from '@/lib/api-client';
import type { IncidentStatus } from '@/types';

export function IncidentDetail({ incidentId }: { incidentId: string }) {
  const { user } = useAuth();
  const canAct = user?.role === 'ADMIN' || user?.role === 'RELEASE_MANAGER';
  const queryClient = useQueryClient();
  const { message, tone, flashOk, flashError } = useFlash();

  const { data: incident, isLoading, error } = useQuery({
    queryKey: ['incident', incidentId],
    queryFn: () => getIncident(incidentId),
  });

  const [flagKey, setFlagKey] = useState('');
  const [environmentKey, setEnvironmentKey] = useState('production');
  const [reason, setReason] = useState('');
  const [rolloutPercentage, setRolloutPercentage] = useState(0);

  const primaryFlagKey = useMemo(() => {
    return incident?.affectedFlags[0]?.featureFlag.key ?? '';
  }, [incident]);

  const activeFlagKey = flagKey || primaryFlagKey;
  const reasonOk = reason.trim().length >= 3;

  const invalidate = async (number: string, id: string) => {
    await queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
    await queryClient.invalidateQueries({ queryKey: ['incident', number] });
    await queryClient.invalidateQueries({ queryKey: ['incident', id] });
    await queryClient.invalidateQueries({ queryKey: ['incidents'] });
    await queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    if (activeFlagKey) {
      await queryClient.invalidateQueries({ queryKey: ['feature-flag', activeFlagKey] });
    }
  };

  const statusMutation = useMutation({
    mutationFn: (status: IncidentStatus) => updateIncidentStatus(incidentId, status),
    onSuccess: async (updated) => {
      await invalidate(updated.number, updated.id);
      flashOk(
        updated.status === 'RESOLVED'
          ? `${updated.number} resolved`
          : `Status → ${updated.status}`,
      );
    },
    onError: (err) => flashError(messageFromError(err)),
  });

  const killMutation = useMutation({
    mutationFn: () =>
      killFlagFromIncident(incidentId, {
        flagKey: activeFlagKey,
        environmentKey,
        reason,
      }),
    onSuccess: async (updated) => {
      setReason('');
      await invalidate(updated.number, updated.id);
      flashOk(`Kill switch fired on ${activeFlagKey} (${environmentKey})`);
    },
    onError: (err) => flashError(messageFromError(err)),
  });

  const reduceMutation = useMutation({
    mutationFn: () =>
      reduceRolloutFromIncident(incidentId, {
        flagKey: activeFlagKey,
        environmentKey,
        rolloutPercentage,
        reason,
      }),
    onSuccess: async (updated) => {
      setReason('');
      await invalidate(updated.number, updated.id);
      flashOk(`Reduced ${activeFlagKey} to ${rolloutPercentage}%`);
    },
    onError: (err) => flashError(messageFromError(err)),
  });

  const busy =
    statusMutation.isPending || killMutation.isPending || reduceMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return <p className="text-sm text-board-danger">Incident not found.</p>;
  }

  return (
    <div className="space-y-4">
      <FlashBanner message={message} tone={tone} />

      <div className="board-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-board-danger">
              Incident
            </div>
            <h2 className="mt-1 font-mono text-2xl font-semibold tracking-tight text-white">
              {incident.number}
            </h2>
            <p className="mt-1 text-lg font-medium text-white">{incident.title}</p>
            <p className="mt-2 text-sm text-board-muted">
              {incident.description || 'No description'}
            </p>
            <p className="mt-2 text-[11px] text-board-muted">
              Opened by {incident.createdBy.name} ·{' '}
              {new Date(incident.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge tone="danger">{incident.severity.replace('_', '-')}</Badge>
            <Badge tone={incident.status === 'RESOLVED' ? 'ok' : 'warn'}>
              {incident.status}
            </Badge>
          </div>
        </div>

        {canAct ? (
          <div className="mt-6 space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Flag key">
                <TextInput
                  placeholder="flag key"
                  value={activeFlagKey}
                  onChange={(e) => setFlagKey(e.target.value)}
                  disabled={busy}
                />
              </Field>
              <Field label="Environment">
                <TextSelect
                  value={environmentKey}
                  onChange={(e) => setEnvironmentKey(e.target.value)}
                  disabled={busy}
                >
                  <option value="production">production</option>
                  <option value="staging">staging</option>
                  <option value="development">development</option>
                </TextSelect>
              </Field>
              <Field label="Reduce to %" hint="Used by Reduce Rollout">
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  value={rolloutPercentage}
                  onChange={(e) => setRolloutPercentage(Number(e.target.value))}
                  disabled={busy}
                />
              </Field>
            </div>
            <Field label="Reason" hint="Required for Kill Switch and Reduce Rollout">
              <TextInput
                placeholder="e.g. Markets filtering incorrectly in production"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={busy}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                loading={killMutation.isPending}
                loadingText="Killing…"
                disabled={busy || !activeFlagKey || !reasonOk}
                onClick={() => killMutation.mutate()}
              >
                Kill Switch
              </Button>
              <Button
                variant="ghost"
                loading={reduceMutation.isPending}
                loadingText="Reducing…"
                disabled={busy || !activeFlagKey || !reasonOk}
                onClick={() => reduceMutation.mutate()}
              >
                Reduce Rollout
              </Button>
              <Button
                variant="ghost"
                loading={
                  statusMutation.isPending && statusMutation.variables === 'RESOLVED'
                }
                loadingText="Resolving…"
                disabled={busy || incident.status === 'RESOLVED'}
                onClick={() => statusMutation.mutate('RESOLVED')}
              >
                Resolve
              </Button>
              {incident.status === 'INVESTIGATING' ? (
                <Button
                  variant="ghost"
                  loading={
                    statusMutation.isPending &&
                    statusMutation.variables === 'IDENTIFIED'
                  }
                  loadingText="Updating…"
                  disabled={busy}
                  onClick={() => statusMutation.mutate('IDENTIFIED')}
                >
                  Mark Identified
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="board-card p-4">
          <h3 className="mb-2 text-sm font-medium">Timeline</h3>
          {!incident.events.length ? (
            <p className="text-sm text-board-muted">No events yet.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-auto">
              {incident.events.map((event, index) => (
                <li
                  key={event.id}
                  className={`rounded border border-board-border px-3 py-2 text-xs text-board-muted transition hover:border-board-muted ${
                    index === 0 ? 'animate-in border-board-accent/40' : ''
                  }`}
                >
                  <div className="font-mono text-board-accent">{event.type}</div>
                  <div className="mt-1 text-white">{event.message}</div>
                  <div className="mt-1 text-[10px]">
                    {event.actor.name} · {new Date(event.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="board-card p-4">
          <h3 className="mb-2 text-sm font-medium">Affected Features</h3>
          {!incident.affectedFlags.length ? (
            <p className="text-sm text-board-muted">No flags linked yet.</p>
          ) : (
            <ul className="space-y-2">
              {incident.affectedFlags.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/feature-flags/${encodeURIComponent(row.featureFlag.key)}`}
                    className="font-mono text-sm text-board-accent transition hover:underline"
                  >
                    {row.featureFlag.key}
                  </Link>
                  <div className="text-xs text-board-muted">{row.featureFlag.name}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 text-xs text-board-muted">
            Assigned: {incident.assignedTo?.name ?? 'Unassigned'}
          </div>
        </section>
      </div>
    </div>
  );
}

function messageFromError(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as { error?: { message?: string } } | undefined;
    return body?.error?.message ?? 'Action failed';
  }
  return 'Action failed';
}
