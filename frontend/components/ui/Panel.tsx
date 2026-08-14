import type { ReactNode } from 'react';

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`board-card animate-slide-up ${className}`}>{children}</section>;
}

export function PanelHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="board-card-header">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-wide text-white">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-board-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PanelBody({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-board-accent">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-board-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'accent',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'accent' | 'ok' | 'warn' | 'danger';
}) {
  const ring =
    tone === 'ok'
      ? 'shadow-glow-ok'
      : tone === 'danger'
        ? 'shadow-glow-danger'
        : tone === 'warn'
          ? 'border-board-warn/30'
          : 'shadow-glow';

  const valueColor =
    tone === 'ok'
      ? 'text-board-ok'
      : tone === 'danger'
        ? 'text-board-danger'
        : tone === 'warn'
          ? 'text-board-warn'
          : 'text-board-accent';

  return (
    <div className={`board-card px-4 py-4 ${ring}`}>
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-board-muted">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-semibold tracking-tight ${valueColor}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-board-muted">{hint}</div> : null}
    </div>
  );
}

export function RolloutBar({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-board-border/80 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-board-accent-strong to-board-accent transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
