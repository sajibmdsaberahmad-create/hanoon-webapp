import { formatPrice } from '@/lib/utils';
import type { ReactNode } from 'react';

// ── Header: top status bar (frosted glass) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface HeaderProps {
  summary: {
    equity: number;
    sessionPnl: number;
    drawdownPct: number;
    botAlive: boolean;
    connectionState: string;
    uptime: number;
    ts: number;
  };
}

export function Header({ summary }: HeaderProps): ReactNode {
  const {
    equity,
    sessionPnl,
    drawdownPct,
    botAlive,
    connectionState,
    uptime,
    ts,
  } = summary;

  const connectionLabel = {
    connected: 'CONNECTED',
    connecting: 'Connecting…',
    stale: 'STALE',
    disconnected: 'DISCONNECTED',
    error: 'ERROR',
  }[connectionState as keyof typeof connectionLabels] ?? 'UNKNOWN';

  const connectionColor = {
    connected: 'text-hanoon-success',
    connecting: 'text-hanoon-warning',
    stale: 'text-hanoon-warning',
    disconnected: 'text-hanoon-error',
    error: 'text-hanoon-error',
  }[connectionState as keyof typeof connectionColors] ?? 'text-hanoon-text-dim';

  const statusDot = botAlive ? 'bg-hanoon-success' : 'bg-hanoon-error';

  // Format uptime
  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  const uptimeStr = `${hours}h ${mins}m`;

  const pnlClass = sessionPnl >= 0 ? 'text-hanoon-success' : 'text-hanoon-error';
  const pnlSign = sessionPnl >= 0 ? '+' : '';

  return (
    <header className="glass-strong sticky top-0 z-40 px-4 py-3 flex items-center justify-between text-xs font-mono">
      {/* Left: Bot status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusDot} animate-pulse-slow`} />
          <span className="text-hanoon-text font-semibold tracking-wider">BOT</span>
          <span className={botAlive ? 'text-hanoon-success' : 'text-hanoon-error'}>
            {botAlive ? 'ALIVE' : 'DEAD'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-hanoon-text-dim">CONN:</span>
          <span className={connectionColor}>{connectionLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-hanoon-text-dim">UPTIME:</span>
          <span className="text-hanoon-text">{uptimeStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-hanoon-text-dim">TS:</span>
          <span className="text-hanoon-text-dim">{new Date(ts * 1000).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Center: Equity + P&L */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-hanoon-text-dim">EQUITY</span>
          <span className="text-hanoon-text font-semibold glow-accent">{formatPrice(equity)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-hanoon-text-dim">P&L</span>
          <span className={pnlClass}>
            {pnlSign}{formatPrice(sessionPnl)} ({pnlSign}{drawdownPct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Right: Layer badges */}
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 glass-pill text-hanoon-juli glow-juli">JULI</span>
        <span className="px-2 py-0.5 glass-pill text-hanoon-nash glow-nash">NASH</span>
        <span className="px-2 py-0.5 glass-pill text-hanoon-halim glow-halim">HALIM</span>
        <span className="px-2 py-0.5 glass-pill text-hanoon-text-dim">IB</span>
        <span className="px-2 py-0.5 glass-pill text-hanoon-accent glow-accent">WEB</span>
      </div>
    </header>
  );
}

const connectionLabels = {
  connected: 'CONNECTED',
  connecting: 'Connecting…',
  stale: 'STALE',
  disconnected: 'DISCONNECTED',
  error: 'ERROR',
};

const connectionColors = {
  connected: 'text-hanoon-success',
  connecting: 'text-hanoon-warning',
  stale: 'text-hanoon-warning',
  disconnected: 'text-hanoon-error',
  error: 'text-hanoon-error',
};
