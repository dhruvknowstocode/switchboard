'use client';

export function FlashBanner({
  message,
  tone = 'ok',
}: {
  message: string | null;
  tone?: 'ok' | 'danger';
}) {
  if (!message) return null;

  const classes =
    tone === 'ok'
      ? 'border-board-ok/40 bg-board-ok/10 text-board-ok'
      : 'border-board-danger/40 bg-board-danger/10 text-board-danger';

  return (
    <div
      className={`animate-in rounded border px-3 py-2 text-xs ${classes}`}
      role="status"
    >
      {message}
    </div>
  );
}
