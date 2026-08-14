'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { createFeatureFlag } from '@/services/feature-flags.service';
import { listEnvironments } from '@/services/environments.service';
import { ApiError } from '@/lib/api-client';

export function CreateFeatureFlagForm({ onCreated }: { onCreated?: () => void }) {
  const router = useRouter();
  const { data: environments } = useQuery({
    queryKey: ['environments'],
    queryFn: listEnvironments,
  });

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [enabled, setEnabled] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onNameChange(value: string) {
    setName(value);
    if (!key || key === slugify(name)) {
      setKey(slugify(value));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const flag = await createFeatureFlag({
        key,
        name,
        description: description || undefined,
        initialConfig: {
          environment,
          enabled,
          rolloutPercentage,
        },
      });
      onCreated?.();
      router.push(`/feature-flags/${encodeURIComponent(flag.key)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: { message?: string } } | undefined;
        setError(body?.error?.message ?? 'Failed to create flag');
      } else {
        setError('Failed to create flag');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel>
      <PanelHeader
        title="Create feature flag"
        description="Starts with a config for the selected environment; other envs get safe defaults."
      />
      <PanelBody>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs text-board-muted">Name</span>
              <input
                className="board-input"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="New Bet Slip"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-board-muted">Key</span>
              <input
                className="board-input font-mono"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="new-bet-slip"
                required
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs text-board-muted">Description</span>
            <textarea
              className="board-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this release change?"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="block space-y-1.5">
              <span className="text-xs text-board-muted">Initial environment</span>
              <select
                className="board-input"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              >
                {(
                  environments ?? [
                    {
                      key: 'production',
                      name: 'Production',
                      id: 'x',
                      description: null,
                      createdAt: '',
                      updatedAt: '',
                    },
                  ]
                ).map((env) => (
                  <option key={env.key} value={env.key}>
                    {env.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-board-muted">Enabled</span>
              <select
                className="board-input"
                value={enabled ? 'true' : 'false'}
                onChange={(e) => setEnabled(e.target.value === 'true')}
              >
                <option value="false">OFF</option>
                <option value="true">ON</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-board-muted">Rollout %</span>
              <input
                type="number"
                min={0}
                max={100}
                className="board-input"
                value={rolloutPercentage}
                onChange={(e) => setRolloutPercentage(Number(e.target.value))}
              />
            </label>
          </div>

          {error ? <p className="text-xs text-board-danger">{error}</p> : null}

          <Button type="submit" disabled={saving} loading={saving} loadingText="Creating…">
            Create flag
          </Button>
        </form>
      </PanelBody>
    </Panel>
  );
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^[0-9]/, '');
}
