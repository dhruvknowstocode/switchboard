'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/providers/AuthProvider';
import { ApiError } from '@/lib/api-client';

export function LoginForm() {
  const router = useRouter();
  const { login, loading, user } = useAuth();
  const [email, setEmail] = useState('admin@switchboard.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: { message?: string } } | undefined;
        setError(body?.error?.message ?? 'Invalid email or password');
      } else {
        setError('Unable to sign in — is the backend running?');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const busy = loading || submitting;

  return (
    <form onSubmit={onSubmit} className="board-card w-full max-w-md space-y-5 p-7 shadow-glow">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-board-accent to-board-accent-strong shadow-glow">
            <span className="font-mono text-sm font-bold text-board-bg">SB</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Switchboard</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-board-muted">
              Control Plane
            </div>
          </div>
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">Sign in</h1>
        <p className="mt-1.5 text-sm text-board-muted">
          Operator access to feature release and incident control.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs text-board-muted">Email</span>
        <input
          className="board-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs text-board-muted">Password</span>
        <input
          className="board-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      {error ? <p className="text-xs text-board-danger">{error}</p> : null}

      <Button type="submit" className="w-full" loading={busy} loadingText="Signing in…">
        Continue
      </Button>

      <p className="text-[11px] leading-relaxed text-board-muted">
        Demo:{' '}
        <span className="font-mono text-board-accent">admin@switchboard.local</span> /{' '}
        <span className="font-mono text-board-accent">Admin123!</span>
      </p>
    </form>
  );
}
