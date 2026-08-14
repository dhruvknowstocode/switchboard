import type { WsConnectionStatus } from '@/types';

export function LiveIndicator({ status }: { status: WsConnectionStatus }) {
  const color =
    status === 'connected'
      ? 'bg-board-ok shadow-[0_0_8px_rgba(52,211,153,0.8)]'
      : status === 'connecting'
        ? 'bg-board-warn'
        : 'bg-board-danger';

  const label =
    status === 'connected'
      ? 'LIVE'
      : status === 'connecting'
        ? 'CONNECTING'
        : status === 'error'
          ? 'ERROR'
          : 'OFFLINE';

  return (
    <div
      className="inline-flex items-center gap-2 rounded-lg border border-board-border/80 bg-board-elevated/60 px-2.5 py-1.5 font-mono text-[11px] tracking-[0.14em] text-white"
      title={`WebSocket: ${status}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${color} ${status === 'connected' ? 'animate-pulse-soft' : ''}`}
      />
      {label}
    </div>
  );
}
