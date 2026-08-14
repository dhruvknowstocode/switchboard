'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
} from '@/components/ui/Panel';
import { listAuditLogs } from '@/services/audit-logs.service';

const ENTITY_FILTERS = [
  { value: '', label: 'All entities' },
  { value: 'FeatureFlag', label: 'FeatureFlag' },
  { value: 'Incident', label: 'Incident' },
  { value: 'Environment', label: 'Environment' },
  { value: 'ApiKey', label: 'ApiKey' },
] as const;

export function AuditLogList() {
  const [entityType, setEntityType] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['audit-logs', entityType],
    queryFn: () =>
      listAuditLogs({
        entityType: entityType || undefined,
        limit: 75,
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compliance"
        title="Audit logs"
        description="Append-only trail of flag, environment, incident, and API-key mutations."
        actions={
          <Button variant="ghost" className="text-xs" onClick={() => void refetch()}>
            Refresh
          </Button>
        }
      />

      <Panel>
        <PanelHeader
          title="Mutation trail"
          description="Newest first. Written by services on every privileged change."
          actions={
            <>
              {isFetching ? <Badge>refreshing</Badge> : <Badge tone="ok">live</Badge>}
              <Badge tone="info">{data?.length ?? 0} shown</Badge>
            </>
          }
        />
        <PanelBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ENTITY_FILTERS.map((filter) => {
              const active = entityType === filter.value;
              return (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => setEntityType(filter.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                    active
                      ? 'border-board-accent/50 bg-board-accent/15 text-board-accent'
                      : 'border-board-border text-board-muted hover:border-board-muted hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <p className="text-sm text-board-muted">Loading audit trail…</p>
          ) : error ? (
            <p className="text-sm text-board-danger">
              Failed to load audit logs. Are you signed in?
            </p>
          ) : !data?.length ? (
            <div className="rounded-xl border border-dashed border-board-border bg-board-bg/40 px-5 py-8 text-center text-sm text-board-muted">
              No audit events yet for this filter. Change a flag rollout or declare an incident.
            </div>
          ) : (
            <ul className="space-y-2">
              {data.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-board-border/80 bg-board-elevated/40 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm text-board-accent">
                          {entry.action}
                        </span>
                        <Badge tone="info">{entry.entityType}</Badge>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-board-muted break-all">
                        entity · {entry.entityId}
                      </div>
                      <div className="mt-1 text-xs text-board-muted">
                        {entry.actor.name} · {entry.actor.role} ·{' '}
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {(entry.newValue != null || entry.previousValue != null) && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] text-board-muted hover:text-white">
                        View payload
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-board-border bg-board-bg p-2 font-mono text-[10px] text-board-muted">
                        {JSON.stringify(
                          {
                            previousValue: entry.previousValue ?? null,
                            newValue: entry.newValue ?? null,
                            metadata: entry.metadata ?? null,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
