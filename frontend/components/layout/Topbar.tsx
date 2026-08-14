'use client';

import { useRouter } from 'next/navigation';
import { LiveIndicator } from '@/components/realtime/LiveIndicator';
import { Button } from '@/components/ui/Button';
import { useRealtime } from '@/components/realtime/RealtimeProvider';
import { useAuth } from '@/components/providers/AuthProvider';

export function Topbar({ title }: { title: string }) {
  const { status } = useRealtime();
  const { user, logout } = useAuth();
  const router = useRouter();

  function onLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <header className="relative z-10 flex h-16 items-center justify-between border-b border-board-border/80 bg-board-panel/60 px-6 backdrop-blur-xl">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-board-muted">
          Operator console
        </div>
        <h1 className="text-base font-semibold tracking-tight text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <div className="hidden items-center gap-3 rounded-xl border border-board-border/80 bg-board-elevated/50 px-3 py-1.5 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-board-accent/15 font-mono text-xs font-semibold text-board-accent">
              {user.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-white">{user.name}</div>
              <div className="font-mono text-[10px] uppercase tracking-wide text-board-muted">
                {user.role}
              </div>
            </div>
          </div>
        ) : null}
        <LiveIndicator status={status} />
        {user ? (
          <Button variant="ghost" onClick={onLogout} className="text-xs">
            Logout
          </Button>
        ) : null}
      </div>
    </header>
  );
}
