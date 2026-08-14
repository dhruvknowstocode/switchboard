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
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from '@/services/api-keys.service';
import { ApiError } from '@/lib/api-client';

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <SettingsPanel />
    </AppShell>
  );
}

function SettingsPanel() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const [name, setName] = useState('SDK client');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: listApiKeys,
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: () => createApiKey(name.trim()),
    onSuccess: async (created) => {
      setCreatedSecret(created.apiKey ?? null);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const body = err.body as { error?: { message?: string } } | undefined;
        setFormError(body?.error?.message ?? 'Failed to create API key');
      } else {
        setFormError('Failed to create API key');
      }
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Operator profile and machine API keys for the Switchboard SDK."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Signed-in operator" actions={<Badge tone="ok">active</Badge>} />
          <PanelBody className="space-y-3">
            <div className="rounded-xl border border-board-border/70 bg-board-elevated/50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-board-muted">Name</div>
              <div className="mt-1 text-sm text-white">{user?.name ?? '—'}</div>
            </div>
            <div className="rounded-xl border border-board-border/70 bg-board-elevated/50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-board-muted">Email</div>
              <div className="mt-1 font-mono text-sm text-board-accent">{user?.email ?? '—'}</div>
            </div>
            <div className="rounded-xl border border-board-border/70 bg-board-elevated/50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-board-muted">Role</div>
              <div className="mt-1">
                <Badge tone="info">{user?.role ?? '—'}</Badge>
              </div>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="SDK integration"
            actions={<Badge tone="info">Folio demo</Badge>}
          />
          <PanelBody className="space-y-2 text-sm text-board-muted">
            <p>
              External apps call evaluate via <code className="text-board-accent">@switchboard/sdk</code>{' '}
              using an API key — not an operator JWT.
            </p>
            <div className="board-row hover:!shadow-none">
              <div className="font-medium text-white">Demo app</div>
              <div className="text-xs">Folio magazine · http://localhost:3001</div>
            </div>
            <div className="board-row hover:!shadow-none">
              <div className="font-medium text-white">Flags</div>
              <div className="text-xs">
                folio-hero-v2 · folio-audio-mode · folio-member-gate
              </div>
            </div>
          </PanelBody>
        </Panel>
      </div>

      {isAdmin ? (
        <Panel>
          <PanelHeader
            title="API keys"
            description="Returned once on create. Revoke immediately if leaked."
            actions={<Badge>ADMIN</Badge>}
          />
          <PanelBody className="space-y-4">
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
            >
              <label className="min-w-[220px] flex-1 space-y-1.5">
                <span className="text-xs text-board-muted">Key name</span>
                <input
                  className="board-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Folio production"
                  required
                />
              </label>
              <Button
                type="submit"
                loading={createMutation.isPending}
                loadingText="Creating…"
              >
                Create key
              </Button>
            </form>

            {formError ? <p className="text-xs text-board-danger">{formError}</p> : null}

            {createdSecret ? (
              <div className="rounded-xl border border-board-ok/40 bg-board-ok/10 px-4 py-3 text-sm text-board-ok">
                <div className="font-medium">Copy this key now — it won’t be shown again</div>
                <code className="mt-2 block break-all font-mono text-xs text-white">
                  {createdSecret}
                </code>
              </div>
            ) : null}

            {isLoading ? (
              <p className="text-sm text-board-muted">Loading keys…</p>
            ) : (
              <ul className="space-y-2">
                {(keys ?? []).map((key) => (
                  <li
                    key={key.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-board-border/80 bg-board-elevated/40 px-4 py-3"
                  >
                    <div>
                      <div className="text-sm text-white">{key.name}</div>
                      <div className="mt-0.5 font-mono text-xs text-board-accent">
                        {key.keyPrefix}…
                      </div>
                      <div className="mt-1 text-[11px] text-board-muted">
                        Created {new Date(key.createdAt).toLocaleString()}
                        {key.lastUsedAt
                          ? ` · last used ${new Date(key.lastUsedAt).toLocaleString()}`
                          : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {key.revokedAt ? (
                        <Badge tone="danger">revoked</Badge>
                      ) : (
                        <Badge tone="ok">active</Badge>
                      )}
                      {!key.revokedAt ? (
                        <Button
                          variant="danger"
                          className="text-xs"
                          loading={
                            revokeMutation.isPending &&
                            revokeMutation.variables === key.id
                          }
                          onClick={() => revokeMutation.mutate(key.id)}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PanelBody>
        </Panel>
      ) : (
        <Panel>
          <PanelBody>
            <p className="text-sm text-board-muted">
              API key management is ADMIN-only. Ask an admin to mint a key for your SDK client.
            </p>
          </PanelBody>
        </Panel>
      )}
    </div>
  );
}
