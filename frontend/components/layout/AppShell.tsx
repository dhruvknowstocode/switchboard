'use client';

import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RealtimeProvider } from '@/components/realtime/RealtimeProvider';

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <RequireAuth>
      <RealtimeProvider>
        <div className="board-shell flex">
          <Sidebar />
          <div className="relative z-10 flex min-w-0 flex-1 flex-col">
            <Topbar title={title} />
            <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
          </div>
        </div>
      </RealtimeProvider>
    </RequireAuth>
  );
}
