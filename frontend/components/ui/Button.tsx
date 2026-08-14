import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-board-accent to-board-accent-strong text-board-bg hover:brightness-110 active:brightness-95 border border-board-accent/40 shadow-glow font-semibold',
  ghost:
    'bg-board-elevated/40 text-board-muted hover:text-white hover:bg-white/5 border border-board-border hover:border-board-muted/60 active:bg-white/10',
  danger:
    'bg-board-danger/15 text-board-danger border border-board-danger/40 hover:bg-board-danger/25 active:bg-board-danger/35 shadow-glow-danger',
};

function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      aria-hidden
    />
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  loading = false,
  loadingText,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
  loadingText?: string;
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
}
