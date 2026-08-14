'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import {
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  RolloutBar,
  StatCard,
} from '@/components/ui/Panel';
import { useRealtime } from '@/components/realtime/RealtimeProvider';
import { listFeatureFlags } from '@/services/feature-flags.service';
import { listIncidents } from '@/services/incidents.service';
import { listAuditLogs } from '@/services/audit-logs.service';

/**
 * Dashboard overview with live flag summary + realtime activity feed.
 */
export function DashboardOverview() {
  const { status, events } = useRealtime();
  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: listFeatureFlags,
  });
  const { data: incidents } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => listIncidents(),
  });
  const { data: audits } = useQuery({
    queryKey: ['audit-logs', 'dashboard'],
    queryFn: () => listAuditLogs({ limit: 8 }),
  });

  const openIncidents = (incidents ?? []).filter((i) => i.status !== 'RESOLVED');

  const productionRollouts =
    flags?.map((flag) => {
      const prod =
        flag.configs.find((c) => c.environment.key === 'production') ?? flag.configs[0];
      return {
        key: flag.key,
        name: flag.name,
        enabled: prod?.enabled ?? false,
        killed: prod?.killed ?? false,
        rollout: prod?.rolloutPercentage ?? 0,
        env: prod?.environment.key ?? '—',
      };
    }) ?? [];

  const enabledCount = productionRollouts.filter((f) => f.enabled && !f.killed).length;
  const avgRollout =
    productionRollouts.length === 0
      ? 0
      : Math.round(
          productionRollouts.reduce((sum, f) => sum + (f.enabled ? f.rollout : 0), 0) /
            productionRollouts.length,
        );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Operations dashboard"
        description="Live view of open incidents, production rollouts, and realtime control-plane activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open incidents"
          value={openIncidents.length}
          hint="Needs operator attention"
          tone={openIncidents.length > 0 ? 'danger' : 'ok'}
        />
        <StatCard
          label="Flags enabled"
          value={isLoading ? '…' : enabledCount}
          hint={`${productionRollouts.length} total in catalog`}
          tone="accent"
        />
        <StatCard
          label="Avg production %"
          value={isLoading ? '…' : `${avgRollout}%`}
          hint="Across catalogued flags"
          tone="warn"
        />
        <StatCard
          label="Realtime"
          value={status === 'connected' ? 'LIVE' : status.toUpperCase()}
          hint="WebSocket /ws"
          tone={status === 'connected' ? 'ok' : 'warn'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel>
          <PanelHeader
            title="Active Incidents"
            actions={<Badge tone="danger">{openIncidents.length} open</Badge>}
          />
          <PanelBody>
            {openIncidents.length === 0 ? (
              <Empty text="No open incidents — production looks calm." />
            ) : (
              <ul className="space-y-2">
                {openIncidents.slice(0, 5).map((incident) => (
                  <li key={incident.id}>
                    <Link
                      href={`/incidents/${encodeURIComponent(incident.number)}`}
                      className="board-row"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-mono text-sm text-board-accent">
                            {incident.number}
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-xs text-board-muted">
                            {incident.title}
                          </div>
                        </div>
                        <Badge tone="warn">{incident.severity.replace('_', '-')}</Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Production rollouts"
            actions={<Badge tone="info">{isLoading ? '…' : `${enabledCount} on`}</Badge>}
          />
          <PanelBody>
            {isLoading ? (
              <Empty text="Loading flags…" />
            ) : productionRollouts.length === 0 ? (
              <Empty text="No flags yet." />
            ) : (
              <ul className="space-y-3">
                {productionRollouts.slice(0, 6).map((flag) => (
                  <li key={flag.key}>
                    <Link
                      href={`/feature-flags/${encodeURIComponent(flag.key)}`}
                      className="block rounded-xl border border-transparent px-1 py-1 transition hover:border-board-border/80 hover:bg-board-elevated/40"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="font-mono text-sm text-white">{flag.key}</span>
                        {flag.killed ? (
                          <Badge tone="danger">killed</Badge>
                        ) : flag.enabled ? (
                          <Badge tone="ok">{flag.rollout}%</Badge>
                        ) : (
                          <Badge tone="danger">off</Badge>
                        )}
                      </div>
                      <RolloutBar value={flag.enabled && !flag.killed ? flag.rollout : 0} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="System status"
            actions={
              <Badge tone={status === 'connected' ? 'ok' : 'warn'}>{status}</Badge>
            }
          />
          <PanelBody>
            <ul className="space-y-2.5">
              {[
                ['API', '/api/v1/health'],
                ['PostgreSQL', 'source of truth'],
                ['Redis', 'cache + Pub/Sub'],
                ['WebSocket', `/ws · ${status}`],
              ].map(([label, value]) => (
                <li
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-board-border/60 bg-board-elevated/40 px-3 py-2"
                >
                  <span className="text-xs text-board-muted">{label}</span>
                  <span className="font-mono text-[11px] text-white">{value}</span>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>

        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Realtime activity"
            description="Flag and incident mutations fan out over Redis Pub/Sub → WebSocket."
            actions={<Badge tone="ok">live feed</Badge>}
          />
          <PanelBody>
            {events.length === 0 ? (
              <Empty text="Change a flag rollout — events appear here instantly." />
            ) : (
              <ul className="max-h-64 space-y-2 overflow-auto pr-1">
                {events.map((event, index) => {
                  const payload = event.payload as {
                    flagKey?: string;
                    environment?: string;
                    rolloutPercentage?: number;
                    enabled?: boolean;
                    deleted?: boolean;
                    number?: string;
                    action?: string;
                    title?: string;
                  };
                  return (
                    <li
                      key={`${event.timestamp}-${index}`}
                      className="rounded-xl border border-board-border/70 bg-board-elevated/40 px-3 py-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-board-accent">
                          {event.type}
                        </span>
                        <span className="text-[10px] text-board-muted">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-board-muted">
                        {payload.number ?? payload.flagKey ?? '—'}
                        {payload.environment ? ` · ${payload.environment}` : ''}
                        {payload.rolloutPercentage !== undefined
                          ? ` · ${payload.rolloutPercentage}%`
                          : ''}
                        {payload.action ? ` · ${payload.action}` : ''}
                        {payload.enabled === false ? ' · disabled' : ''}
                        {payload.deleted ? ' · deleted' : ''}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent changes"
            description="From the append-only audit trail."
            actions={
              <Link href="/audit-logs" className="text-xs text-board-accent hover:underline">
                View all
              </Link>
            }
          />
          <PanelBody>
            {!audits?.length ? (
              <Empty text="No audit events yet." />
            ) : (
              <ul className="space-y-2">
                {audits.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-board-border/60 bg-board-elevated/40 px-3 py-2"
                  >
                    <div className="font-mono text-[11px] text-board-accent">{entry.action}</div>
                    <div className="text-[11px] text-board-muted">
                      {entry.actor.name} · {entry.entityType} ·{' '}
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Quick links" actions={<Badge>navigate</Badge>} />
          <PanelBody className="space-y-2">
            {[
              ['Feature Flags', '/feature-flags', 'Create & control rollouts'],
              ['Incidents', '/incidents', 'Declare & remediate'],
              ['Audit Logs', '/audit-logs', 'Who changed what'],
              ['Environments', '/environments', 'dev / staging / prod'],
            ].map(([label, href, hint]) => (
              <Link key={href} href={href} className="board-row">
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-board-muted">{hint}</div>
              </Link>
            ))}
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-board-border/80 bg-board-bg/40 px-4 py-6 text-center text-sm text-board-muted">
      {text}
    </div>
  );
}
