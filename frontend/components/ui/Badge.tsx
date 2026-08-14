import type { ReactNode } from 'react';

type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-board-border/70 text-board-muted ring-board-border',
  ok: 'bg-board-ok/10 text-board-ok ring-board-ok/25',
  warn: 'bg-board-warn/10 text-board-warn ring-board-warn/25',
  danger: 'bg-board-danger/10 text-board-danger ring-board-danger/25',
  info: 'bg-board-accent/10 text-board-accent ring-board-accent/25',
};

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ring-1 ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
