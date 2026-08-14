'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV: Array<{ href: string; label: string; icon: ReactNode }> = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    ),
  },
  {
    href: '/feature-flags',
    label: 'Feature Flags',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7.5V6a2.25 2.25 0 012.25-2.25h4.5A2.25 2.25 0 0112 6v1.5m0 0v9.75A2.25 2.25 0 019.75 19.5h-4.5A2.25 2.25 0 013 17.25V7.5m9 0h6.75A2.25 2.25 0 0121 9.75v7.5A2.25 2.25 0 0118.75 19.5H12"
      />
    ),
  },
  {
    href: '/incidents',
    label: 'Incidents',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    ),
  },
  {
    href: '/audit-logs',
    label: 'Audit Logs',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    ),
  },
  {
    href: '/environments',
    label: 'Environments',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative z-10 flex w-60 shrink-0 flex-col border-r border-board-border/80 bg-board-panel/80 backdrop-blur-xl">
      <div className="border-b border-board-border/80 px-4 py-5">
        <Link href="/dashboard" className="group block">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-board-accent to-board-accent-strong shadow-glow">
              <span className="font-mono text-sm font-bold text-board-bg">SB</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-white group-hover:text-board-accent">
                Switchboard
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-board-muted">
                Control Plane
              </div>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? 'bg-board-accent/15 text-white shadow-glow ring-1 ring-board-accent/30'
                  : 'text-board-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg
                className={`h-4 w-4 shrink-0 ${active ? 'text-board-accent' : 'text-board-muted group-hover:text-white'}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
                aria-hidden
              >
                {item.icon}
              </svg>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-board-border/80 p-4">
        <div className="rounded-xl border border-board-border/70 bg-board-elevated/60 px-3 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-board-accent">
            Control plane
          </div>
          <div className="mt-1 text-[11px] text-board-muted">
            Flags · Incidents · Audit
          </div>
        </div>
      </div>
    </aside>
  );
}
