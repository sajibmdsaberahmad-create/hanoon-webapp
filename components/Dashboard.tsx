'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTelemetry } from '@/components/TelemetryProvider';
import { ReconnectionBanner } from '@/components/ReconnectingProvider';
import { ControlPanel, EquityChart, StatCard } from '@/components/ui';
import { CommandCenter } from '@/components/CommandCenter';
import { OverviewPanel } from '@/components/panels/OverviewPanel';
import { PositionsPanel } from '@/components/panels/PositionsPanel';
import { BrainPanel } from '@/components/panels/BrainPanel';
import { TradesPanel } from '@/components/panels/TradesPanel';
import { ReflectionPanel } from '@/components/panels/ReflectionPanel';
import { SystemPanel } from '@/components/panels/SystemPanel';
import { LogsPanel } from '@/components/panels/LogsPanel';
import { SignalSpectrum } from '@/components/SignalSpectrum';

/**
 * Main Dashboard — frosted-glass tabbed shell ("windows"), classic HANOON.
 *
 * Each tab is its own window, separated + organized:
 *   ◈ Overview · ✦ Brain · ◆ Positions · ↔ Trades · 🎛 Control · ⚙ System · ≣ Logs
 *
 * - Tab state lives in the URL hash (#trades) so refresh/back/forward work.
 * - Active tab glows in its own gradient accent; panels re-mount with a
 *   slide/fade transition (panel-enter).
 * - Badges show live counts (positions / predictions / trades).
 */

type TabKey = 'overview' | 'brain' | 'positions' | 'trades' | 'control' | 'system' | 'logs';

const TABS: Array<{ id: TabKey; label: string; icon: string; accent: string }> = [
  { id: 'overview',   label: 'Overview',   icon: '◈', accent: 'bg-gradient-to-r from-emerald-400 to-green-500 text-gray-950 shadow-[0_0_16px_rgba(52,211,153,0.35)]' },
  { id: 'brain',      label: 'Brain',      icon: '✦', accent: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-gray-950 shadow-[0_0_16px_rgba(34,211,238,0.35)]' },
  { id: 'positions',  label: 'Positions',  icon: '◆', accent: 'bg-gradient-to-r from-teal-300 to-emerald-500 text-gray-950 shadow-[0_0_16px_rgba(45,212,191,0.35)]' },
  { id: 'trades',     label: 'Trades',     icon: '↔', accent: 'bg-gradient-to-r from-amber-300 to-orange-500 text-gray-950 shadow-[0_0_16px_rgba(251,191,36,0.35)]' },
  { id: 'control',    label: 'Control',    icon: '🎛', accent: 'bg-gradient-to-r from-orange-400 to-red-500 text-gray-950 shadow-[0_0_16px_rgba(251,146,60,0.35)]' },
  { id: 'system',     label: 'System',     icon: '⚙', accent: 'bg-gradient-to-r from-violet-400 to-purple-600 text-gray-950 shadow-[0_0_16px_rgba(167,139,250,0.35)]' },
  { id: 'logs',       label: 'Logs',       icon: '≣', accent: 'bg-gradient-to-r from-slate-300 to-slate-500 text-gray-950 shadow-[0_0_16px_rgba(148,163,184,0.35)]' },
];

function tabFromHash(): TabKey {
  if (typeof window === 'undefined') return 'overview';
  const h = window.location.hash.replace('#', '');
  return TABS.some((t) => t.id === h) ? (h as TabKey) : 'overview';
}

export function Dashboard() {
  const { data, connectionState, latencyMs, stale, loading, error } = useTelemetry();
  const [tab, setTab] = useState<TabKey>(() => tabFromHash());

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (id: TabKey) => {
    if (id !== tab) window.location.hash = id;
    setTab(id);
  };

  const badges = useMemo(() => {
    if (!data) return {} as Record<string, string>;
    const positions = Array.isArray(data.positions) ? data.positions.length : 0;
    const preds = (data.nash_predictions as any[])?.length || 0;
    const trades = (data.trades as any[])?.length || 0;
    return {
      positions: positions ? String(positions) : '',
      brain: preds ? String(preds) : '',
      trades: trades ? String(trades) : '',
    } as Record<string, string>;
  }, [data]);

  if (!data && loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass rounded-2xl px-8 py-6 text-center fade-in-up">
          <div className="text-3xl mb-2 animate-pulse-slow">🚀</div>
          <div className="text-hanoon-text-dim">Connecting to HANOON 3.0…</div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-hanoon-error">
        <div className="glass rounded-2xl px-8 py-6 text-center fade-in-up">
          <div className="text-2xl mb-2">❌</div>
          <div>Connection Error: {error}</div>
          <div className="text-sm text-hanoon-text-dim mt-2">
            Make sure the HANOON bot is running (start.command)
          </div>
        </div>
      </div>
    );
  }

  const equity = data?.portfolio?.equity ?? data?.equity ?? 0;
  const drawdown = data?.portfolio?.drawdown ?? 0;
  const riskScalar = data?.portfolio?.risk_scalar ?? 0;
  const positionCount = data?.positions?.length ?? 0;

  return (
    <div className="min-h-screen text-gray-200">
      <ReconnectionBanner
        state={connectionState}
        error={error}
        latency={latencyMs}
        stale={stale}
      />

      {/* ── Tab bar (sticky — stays pinned while content scrolls) ── */}
      <nav className="sticky top-[52px] z-30 border-b border-white/10 bg-white/5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="px-2 sm:px-4 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
            {TABS.map((t) => {
              const active = tab === t.id;
              const badge = badges[t.id];
              return (
                <button
                  key={t.id}
                  onClick={() => go(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap
                    transition-all duration-200 active:scale-95
                    ${active
                      ? t.accent
                      : 'text-gray-400 border border-white/10 bg-white/5 backdrop-blur-md hover:text-gray-200 hover:border-white/25'}
                  `}
                >
                  <span className="text-[11px]">{t.icon}</span>
                  {t.label}
                  {badge && (
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono ${
                      active ? 'bg-gray-950/25 text-inherit' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Live mini-pill (right, stays pinned) */}
            <div className="ml-auto pl-3 flex items-center gap-2 shrink-0 text-[10px] font-mono text-gray-500">
              <span className={`flex items-center gap-1 ${stale ? 'text-amber-400' : 'text-green-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stale ? 'bg-amber-400 animate-pulse' : 'bg-green-400 animate-pulse'}`} />
                {stale ? 'STALE' : 'LIVE'}
              </span>
              <span className="hidden sm:inline text-gray-600">|</span>
              <span className="hidden sm:inline text-emerald-300">
                ${equity.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Active panel (key re-mounts for the entrance animation) ── */}
      <div className="px-3 sm:px-4 py-4 sm:py-5 max-w-[1600px] mx-auto">
        <div key={tab} className="panel-enter">
          {tab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2">
                <OverviewPanel data={data} />
              </div>
              <div className="xl:col-span-1 space-y-4">
                <StatCard label="Equity" value={`$${equity.toFixed(2)}`} trend="up" color="text-hanoon-accent glow-accent" />
                <StatCard label="Drawdown" value={`${(drawdown * 100).toFixed(2)}%`} trend="down" color={drawdown > 0.2 ? 'text-hanoon-error' : 'text-hanoon-warning'} />
                <StatCard label="Risk Scalar" value={riskScalar.toFixed(2)} trend="flat" color={data?.portfolio?.stress_mode ? 'text-hanoon-error' : 'text-hanoon-success'} />
                <StatCard label="Positions" value={String(positionCount)} trend="flat" color="text-hanoon-nash glow-nash" />
                {data?.equity_history && data.equity_history.length > 1 && (
                  <div className="glass rounded-2xl p-3">
                    <EquityChart history={data.equity_history} />
                  </div>
                )}
              </div>
            </div>
          )}
          {tab === 'brain' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <BrainPanel data={data} />
              <div>
                <SignalSpectrum data={data} />
              </div>
            </div>
          )}
          {tab === 'positions' && <PositionsPanel data={data} />}
          {tab === 'trades' && <TradesPanel data={data} />}
          {tab === 'control' && <CommandCenter />}
          {tab === 'system' && <SystemPanel data={data} />}
          {tab === 'logs' && <LogsPanel data={data} />}
        </div>
      </div>
    </div>
  );
}
