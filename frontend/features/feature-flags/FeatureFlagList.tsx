'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  RolloutBar,
} from '@/components/ui/Panel';
import { listFeatureFlags } from '@/services/feature-flags.service';
import { useAuth } from '@/components/providers/AuthProvider';
import { CreateFeatureFlagForm } from './CreateFeatureFlagForm';

function preferredConfig(flag: Awaited<ReturnType<typeof listFeatureFlags>>[number]) {
  return (
    flag.configs.find((c) => c.environment.key === 'production') ??
    flag.configs[0] ??
    null
  );
}

export function FeatureFlagList() {
  const { user } = useAuth();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'RELEASE_MANAGER';

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: listFeatureFlags,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Feature flags"
        description="Progressive delivery controls — create flags, set rollouts, and kill switches without redeploying."
        actions={
          <Button variant="ghost" className="text-xs" onClick={() => void refetch()}>
            Refresh
          </Button>
        }
      />

      {canCreate ? <CreateFeatureFlagForm onCreated={() => void refetch()} /> : null}

      <Panel>
        <PanelHeader
          title="All flags"
          description="Showing preferred production config where available."
          actions={
            <>
              {isFetching ? <Badge>refreshing</Badge> : <Badge tone="ok">live</Badge>}
              <Badge tone="info">{data?.length ?? 0} flags</Badge>
            </>
          }
        />
        <PanelBody>
          {isLoading ? (
            <p className="text-sm text-board-muted">Loading flags…</p>
          ) : error ? (
            <p className="text-sm text-board-danger">
              Failed to load feature flags. Are you signed in and is the API running?
            </p>
          ) : !data?.length ? (
            <p className="text-sm text-board-muted">No feature flags yet. Create one above.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.map((flag) => {
                const config = preferredConfig(flag);
                const pct = config?.rolloutPercentage ?? 0;
                return (
                  <li key={flag.id}>
                    <Link
                      href={`/feature-flags/${encodeURIComponent(flag.key)}`}
                      className="board-row"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white">{flag.name}</div>
                          <div className="mt-0.5 font-mono text-xs text-board-accent">
                            {flag.key}
                          </div>
                          <div className="mt-1 text-[11px] text-board-muted">
                            Updated {new Date(flag.updatedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="info">{config?.environment.key ?? 'no-env'}</Badge>
                          {config?.killed ? (
                            <Badge tone="danger">Killed</Badge>
                          ) : config?.enabled ? (
                            <Badge tone="ok">Enabled</Badge>
                          ) : (
                            <Badge tone="danger">Disabled</Badge>
                          )}
                          <Badge tone="warn">{pct}%</Badge>
                        </div>
                      </div>
                      <RolloutBar
                        className="mt-3"
                        value={config?.enabled && !config.killed ? pct : 0}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
