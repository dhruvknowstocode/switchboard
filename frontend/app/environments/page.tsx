'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
} from '@/components/ui/Panel';
import { useAuth } from '@/components/providers/AuthProvider';
import { createEnvironment, listEnvironments } from '@/services/environments.service';
import { ApiError } from '@/lib/api-client';

export default function EnvironmentsPage() {
  return (
    <AppShell title="Environments">
      <EnvironmentsPanel />
    </AppShell>
  );
}

function EnvironmentsPanel() {
  const { user } = useAuth();
  const canCreate = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['environments'],
    queryFn: listEnvironments,
  });

  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createEnvironment({ key, name }),
    onSuccess: async () => {
      setKey('');
      setName('');
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ['environments'] });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const body = err.body as { error?: { message?: string } } | undefined;
        setFormError(body?.error?.message ?? 'Failed to create environment');
      } else {
        setFormError('Failed to create environment');
      }
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Topology"
        title="Environments"
        description="Logical deployment targets used by flag configs and evaluation (development, staging, production)."
      />

      {canCreate ? (
        <Panel>
          <PanelHeader
            title="Create environment"
            description="ADMIN only. New flags seed a default config for every environment."
          />
          <PanelBody>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="board-input font-mono"
                  placeholder="production"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  required
                />
                <input
                  className="board-input"
                  placeholder="Production"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              {formError ? <p className="text-xs text-board-danger">{formError}</p> : null}
              <Button type="submit" loading={mutation.isPending} loadingText="Creating…">
                Create
              </Button>
            </form>
          </PanelBody>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader
          title="Configured environments"
          actions={<Badge tone="ok">postgres</Badge>}
        />
        <PanelBody>
          {isLoading ? (
            <p className="text-sm text-board-muted">Loading…</p>
          ) : error ? (
            <p className="text-sm text-board-danger">Failed to load environments.</p>
          ) : (
            <ul className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {(data ?? []).map((env) => (
                <li
                  key={env.id}
                  className="rounded-xl border border-board-border/80 bg-board-elevated/50 px-4 py-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-sm text-white">{env.key}</div>
                      <div className="mt-0.5 text-xs text-board-muted">{env.name}</div>
                    </div>
                    <Badge tone="info">{env.key}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
