'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { formatPrice, formatPercent } from '@/lib/utils';

// ── Overview Panel: L0 bot state, connections, hero strip ━━━━━━━━━━━━━

interface OverviewPanelProps {
  data: TelemetrySnapshot | null;
}

export function OverviewPanel({ data }: OverviewPanelProps) {
  if (!data) return <PanelSkeleton label="OVERVIEW" />;

  const system = data.system || {};
  const component = data.component_status || {};
  const sleep = data.sleep || {};
  const runner = data.runner || {};
  const api = data.api || {};
  const vault = data.vault || {};
  const portfolio = data.portfolio || {};

  const equity = data.equity ?? portfolio.equity ?? 0;
  const sessionPnl = data.session_pnl ?? 0;
  const drawdown = data.drawdown_pct ?? portfolio.drawdown ?? 0;

  return (
    <div className="space-y-4">
      {/* ══ Hero strip ══ */}
      <section className="glass glass-hover rounded-2xl p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
                Equity
                <span className={`w-2 h-2 rounded-full ${data.ts ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              </div>
              <div className="relative overflow-hidden rounded-md mt-1">
                <div className="gradient-text font-mono text-2xl sm:text-3xl font-bold truncate">
                  {formatPrice(equity)}
                </div>
                <div className="shimmer absolute inset-0 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500">Session P&L</div>
              <div className={`font-mono text-xl sm:text-2xl font-bold mt-1 truncate ${sessionPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {sessionPnl >= 0 ? '+' : ''}{formatPrice(sessionPnl)}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500">Peak Equity</div>
              <div className="font-mono text-xl sm:text-2xl font-bold mt-1 truncate text-gray-300">
                {formatPrice(portfolio.peak_equity ?? equity)}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500">Drawdown</div>
              <div className={`font-mono text-xl sm:text-2xl font-bold mt-1 truncate ${
                drawdown > 5 ? 'text-red-400' : drawdown > 2 ? 'text-amber-400' : 'text-green-400'
              }`}>
                {formatPercent(drawdown)}
              </div>
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Chip color="text-gray-300 border-white/10 bg-white/5">
              Realized <span className={(portfolio as any).realized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}>{formatPrice((portfolio as any).realized_pnl ?? 0)}</span>
            </Chip>
            <Chip color="text-gray-300 border-white/10 bg-white/5">
              Trades <span className="text-gray-200">{data.buffer?.trade_count ?? 0}</span>
            </Chip>
            <Chip color="text-gray-300 border-white/10 bg-white/5">
              Win Rate <span className="text-emerald-400">{formatPercent((data.buffer?.win_rate ?? 0) * 100)}</span>
            </Chip>
            <Chip color="text-gray-300 border-white/10 bg-white/5">
              Exposure <span className="text-cyan-300">{formatPercent(portfolio.exposure ?? 0)}</span>
            </Chip>
            <Chip color="text-gray-300 border-white/10 bg-white/5">
              Positions <span className="text-teal-300">{data.positions?.length ?? 0}</span>
            </Chip>
          </div>
        </div>
      </section>

      {/* ══ Component health ══ */}
      <section className="glass glass-hover rounded-2xl p-4">
        <SectionTitle>Component Health</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <MetricCard label="CPU" value={`${system.cpu_pct?.toFixed(1)}%`} color={Number(system.cpu_pct) > 70 ? 'text-hanoon-error' : 'text-hanoon-success'} />
          <MetricCard label="Memory" value={`${system.memory_rss_mb?.toFixed(0)}MB`} color={Number(system.memory_rss_mb) > 8000 ? 'text-hanoon-error' : 'text-hanoon-success'} />
          <MetricCard label="Disk" value={`${system.disk_pct?.toFixed(1)}%`} color={Number(system.disk_pct) > 90 ? 'text-hanoon-error' : 'text-hanoon-success'} />
          <MetricCard label="IB Connected" value={component.ib_connected ? 'YES' : 'NO'} color={component.ib_connected ? 'text-hanoon-success' : 'text-hanoon-error'} />
          <MetricCard label="HALIM" value={vault.halim_serve ? 'RUNNING' : 'STOPPED'} color={vault.halim_serve ? 'text-hanoon-halim' : 'text-hanoon-error'} />
          <MetricCard label="API Server" value={api.running ? 'ON' : 'OFF'} color={api.running ? 'text-hanoon-success' : 'text-hanoon-error'} />
        </div>
      </section>

      {/* ══ Mode + vault ══ */}
      <section className="glass glass-hover rounded-2xl p-4">
        <SectionTitle>Mode & Vault</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <MetricCard label="Session Phase" value={data.session_phase || '—'} color="text-hanoon-nash" />
          <MetricCard label="Regime" value={data.regime || '—'} color="text-hanoon-warning" />
          <MetricCard label="Sleep" value={sleep.sleep_state || '—'} color="text-hanoon-text-dim" />
          <MetricCard label="Paused" value={data.paused ? 'YES' : 'NO'} color={data.paused ? 'text-hanoon-warning' : 'text-hanoon-success'} />
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <span className={vault.halim_serve ? 'text-hanoon-halim' : 'text-hanoon-error'}>
            HALIM: {vault.halim_serve ? '●' : '○'} serve
          </span>
          <span className={vault.ib_gateway ? 'text-hanoon-nash' : 'text-hanoon-error'}>
            IB: {vault.ib_gateway ? '●' : '○'} gateway
          </span>
          <span className={vault.ngrok ? 'text-hanoon-warning' : 'text-hanoon-error'}>
            NGROK: {vault.ngrok ? '●' : '○'} tunnel
          </span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-500">Cycles: {runner.cycle_count ?? 0}</span>
        </div>
      </section>

      {/* ══ Recent actions ══ */}
      {runner.recent_actions && runner.recent_actions.length > 0 && (
        <section className="glass glass-hover rounded-2xl p-4">
          <SectionTitle>Recent Actions</SectionTitle>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {runner.recent_actions.map((a: any, i) => (
              <div key={i} className="text-xs font-mono debate-in" style={{ animationDelay: `${i * 40}ms` }}>
                <span className="text-hanoon-text-dim">{new Date(a.ts * 1000).toLocaleTimeString()}</span>
                <span className="text-hanoon-nash"> {a.ticker}</span>
                <span className={a.action === 'BUY' ? 'text-hanoon-success' : a.action === 'SELL' ? 'text-hanoon-error' : 'text-hanoon-text-dim'}> {a.action}</span>
                <span className="text-hanoon-text-dim"> score={a.score?.toFixed(4)} dir={a.direction} halim={a.halim?.toFixed(3)} nash={a.nash?.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Small helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
      <span className="w-1 h-4 rounded-full bg-gradient-to-b from-cyan-400 via-emerald-400 to-violet-500" />
      {children}
    </div>
  );
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono border ${color}`}>
      {children}
    </span>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass-inset rounded-xl p-2.5 text-center">
      <div className="text-[10px] text-hanoon-text-dim uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-medium mt-0.5 ${color || 'text-hanoon-text'}`}>{value}</div>
    </div>
  );
}

function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs font-mono text-hanoon-text-dim mb-2">▶ {label}</div>
      <div className="animate-pulse">
        <div className="h-3 bg-hanoon-bg rounded w-3/4 mb-1"></div>
        <div className="h-3 bg-hanoon-bg rounded w-1/2"></div>
      </div>
    </div>
  );
}
