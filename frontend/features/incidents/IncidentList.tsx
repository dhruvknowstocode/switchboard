'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
} from '@/components/ui/Panel';
import { useAuth } from '@/components/providers/AuthProvider';
import { createIncident, listIncidents } from '@/services/incidents.service';
import { listFeatureFlags } from '@/services/feature-flags.service';
import { ApiError } from '@/lib/api-client';
import type { Severity } from '@/types';

function severityTone(severity: Severity) {
  if (severity === 'SEV_1') return 'danger' as const;
  if (severity === 'SEV_2') return 'warn' as const;
  return 'info' as const;
}

export function IncidentList() {
  const { user } = useAuth();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'RELEASE_MANAGER';
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => listIncidents(),
  });

  const { data: flags } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: listFeatureFlags,
    enabled: canCreate,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('SEV_2');
  const [flagKey, setFlagKey] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      createIncident({
        title,
        description: description || undefined,
        severity,
        affectedFlagKeys: flagKey ? [flagKey] : undefined,
      }),
    onSuccess: async (incident) => {
      setTitle('');
      setDescription('');
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ['incidents'] });
      router.push(`/incidents/${encodeURIComponent(incident.number)}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const body = err.body as { error?: { message?: string } } | undefined;
        setFormError(body?.error?.message ?? 'Failed to create incident');
      } else {
        setFormError('Failed to create incident');
      }
    },
  });

  const open = (data ?? []).filter((i) => i.status !== 'RESOLVED');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Response"
        title="Incidents"
        description="Declare production issues and drive remediation through flag kill / reduce-rollout actions."
        actions={
          <Button variant="ghost" className="text-xs" onClick={() => void refetch()}>
            Refresh
          </Button>
        }
      />

      {canCreate ? (
        <Panel>
          <PanelHeader
            title="Declare incident"
            description="Operators create incidents after detecting issues externally (metrics, users, alerts)."
          />
          <PanelBody>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
            >
              <input
                className="board-input"
                placeholder="Title — e.g. Bet slip errors elevated"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                className="board-input"
                placeholder="Description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="board-input"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                >
                  <option value="SEV_1">SEV-1</option>
                  <option value="SEV_2">SEV-2</option>
                  <option value="SEV_3">SEV-3</option>
                  <option value="SEV_4">SEV-4</option>
                </select>
                <select
                  className="board-input"
                  value={flagKey}
                  onChange={(e) => setFlagKey(e.target.value)}
                >
                  <option value="">Affected flag (optional)</option>
                  {(flags ?? []).map((flag) => (
                    <option key={flag.id} value={flag.key}>
                      {flag.key}
                    </option>
                  ))}
                </select>
              </div>
              {formError ? <p className="text-xs text-board-danger">{formError}</p> : null}
              <Button
                type="submit"
                loading={createMutation.isPending}
                loadingText="Creating…"
              >
                Create incident
              </Button>
            </form>
          </PanelBody>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader
          title="Incident queue"
          actions={
            <>
              <Badge tone="danger">{open.length} open</Badge>
              {isFetching ? <Badge>refreshing</Badge> : <Badge tone="ok">live</Badge>}
            </>
          }
        />
        <PanelBody>
          {isLoading ? (
            <p className="text-sm text-board-muted">Loading…</p>
          ) : error ? (
            <p className="text-sm text-board-danger">Failed to load incidents.</p>
          ) : !data?.length ? (
            <p className="text-sm text-board-muted">No incidents yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.map((incident) => (
                <li key={incident.id}>
                  <Link
                    href={`/incidents/${encodeURIComponent(incident.number)}`}
                    className="board-row hover:!border-board-danger/40 hover:!shadow-glow-danger"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-mono text-sm text-white">{incident.number}</div>
                        <div className="mt-0.5 text-xs text-board-muted">{incident.title}</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge tone={severityTone(incident.severity)}>
                          {incident.severity.replace('_', '-')}
                        </Badge>
                        <Badge tone={incident.status === 'RESOLVED' ? 'ok' : 'warn'}>
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
