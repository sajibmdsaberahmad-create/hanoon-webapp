import { formatPrice } from '@/lib/utils';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

// ── Header: command center top bar ─────────────────────────────────────────

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

const connectionMeta: Record<string, { label: string; badge: string; dot: string }> = {
  connected: { label: 'Connected', badge: 'badge-success', dot: 'dot-success dot-live' },
  connecting: { label: 'Connecting', badge: 'badge-warning', dot: 'dot-warning' },
  stale: { label: 'Stale data', badge: 'badge-warning', dot: 'dot-warning' },
  disconnected: { label: 'Disconnected', badge: 'badge-error', dot: 'dot-error' },
  error: { label: 'Connection error', badge: 'badge-error', dot: 'dot-error' },
};

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

  const conn = connectionMeta[connectionState] ?? connectionMeta.disconnected;
  const pnlPositive = sessionPnl >= 0;

  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);

  // Clock renders only after mount to avoid SSR hydration mismatch.
  const [clock, setClock] = useState<string | null>(null);
  useEffect(() => {
    setClock(
      new Date(ts * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );
  }, [ts]);

  return (
    <header className="sticky top-0 z-40 border-b border-hanoon-border bg-hanoon-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-hanoon-accent to-hanoon-nash font-sans text-sm font-bold text-black">
            H
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-hanoon-text">
              HANOON <span className="text-hanoon-accent">3.0</span>
            </div>
            <div className="text-[11px] text-hanoon-text-dim">Trading Intelligence</div>
          </div>
        </div>

        {/* Bot + connection status */}
        <div className="hidden items-center gap-2 md:flex">
          <span className={`badge ${botAlive ? 'badge-success' : 'badge-error'}`}>
            <span className={`dot ${botAlive ? 'dot-success dot-live' : 'dot-error'}`} />
            {botAlive ? 'Engine live' : 'Engine stopped'}
          </span>
          <span className={`badge ${conn.badge}`}>
            <span className={`dot ${conn.dot}`} />
            {conn.label}
          </span>
        </div>

        {/* Equity / P&L */}
        <div className="ml-auto flex items-center gap-5 sm:gap-7">
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-hanoon-text-faint">
              Equity
            </div>
            <div className="tnum text-sm font-semibold text-hanoon-text">
              {formatPrice(equity)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-hanoon-text-faint">
              Session P&L
            </div>
            <div
              className={`tnum text-sm font-semibold ${
                pnlPositive ? 'text-hanoon-success' : 'text-hanoon-error'
              }`}
            >
              {pnlPositive ? '+' : ''}
              {formatPrice(sessionPnl)}
              <span className="ml-1.5 text-xs opacity-80">
                {pnlPositive ? '+' : ''}
                {drawdownPct.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="hidden text-right lg:block">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-hanoon-text-faint">
              Uptime
            </div>
            <div className="tnum text-sm text-hanoon-text-dim">
              {hours}h {mins}m
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-hanoon-text-faint">
              Updated
            </div>
            <div className="tnum text-sm text-hanoon-text-dim">{clock ?? '—'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
