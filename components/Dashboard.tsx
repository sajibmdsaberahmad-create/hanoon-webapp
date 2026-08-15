'use client';

import { useState } from 'react';
import { useTelemetry } from '@/components/TelemetryProvider';
import { ReconnectionBanner } from '@/components/ReconnectingProvider';
import { ControlPanel, EquityChart, StatCard } from '@/components/ui';
import { OverviewPanel } from '@/components/panels/OverviewPanel';
import { PositionsPanel } from '@/components/panels/PositionsPanel';
import { BrainPanel } from '@/components/panels/BrainPanel';
import { TradesPanel } from '@/components/panels/TradesPanel';
import { ReflectionPanel } from '@/components/panels/ReflectionPanel';
import { SystemPanel } from '@/components/panels/SystemPanel';
import { LogsPanel } from '@/components/panels/LogsPanel';
import { SignalSpectrum } from '@/components/SignalSpectrum';

/**
 * Main Dashboard — frosted-glass tabbed layout of all 10 HANOON layers.
 *
 * Tabs (responsive pill bar, sticky under the header):
 *   OVERVIEW  → stat cards, controls, connection + system summary
 *   POSITIONS → live position health, exit triggers, TBT urgency
 *   BRAIN     → JULI alpha, thinking, Nash, Halim, debate, spectrum
 *   TRADES    → fills, brackets, buffer stats
 *   REFLECTION→ buffer, review, retrain, supervisor
 *   SYSTEM    → CPU/mem/disk, watchdog, sleep, telemetry hub
 *   LOGS      → threads, heartbeats, recent actions
 */

type TabKey = 'overview' | 'positions' | 'brain' | 'trades' | 'reflection' | 'system' | 'logs';

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'overview',   label: 'Overview',   icon: '◈' },
  { key: 'positions',  label: 'Positions',  icon: '▤' },
  { key: 'brain',      label: 'Brain',      icon: '◉' },
  { key: 'trades',     label: 'Trades',     icon: '⇄' },
  { key: 'reflection', label: 'Learning',   icon: '↻' },
  { key: 'system',     label: 'System',     icon: '⚙' },
  { key: 'logs',       label: 'Logs',       icon: '≣' },
];

export function Dashboard() {
  const { data, connectionState, latencyMs, stale, loading, error, refresh } = useTelemetry();
  const [tab, setTab] = useState<TabKey>('overview');

  if (!data && loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass rounded-2xl px-8 py-6 text-center">
          <div className="text-3xl mb-2 animate-pulse-slow">🚀</div>
          <div className="text-hanoon-text-dim">Connecting to HANOON 3.0…</div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-hanoon-error">
        <div className="glass rounded-2xl px-8 py-6 text-center">
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
    <div className="p-4 max-w-[1600px] mx-auto">
      <ReconnectionBanner
        state={connectionState}
        error={error}
        latency={latencyMs}
        stale={stale}
      />

      {/* Top stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Equity"
          value={`$${equity.toFixed(2)}`}
          trend="up"
          color="text-hanoon-accent glow-accent"
        />
        <StatCard
          label="Drawdown"
          value={`${(drawdown * 100).toFixed(2)}%`}
          trend="down"
          color={drawdown > 0.2 ? 'text-hanoon-error' : 'text-hanoon-warning'}
        />
        <StatCard
          label="Risk Scalar"
          value={riskScalar.toFixed(2)}
          trend="flat"
          color={data?.portfolio?.stress_mode ? 'text-hanoon-error' : 'text-hanoon-success'}
        />
        <StatCard
          label="Positions"
          value={String(positionCount)}
          trend="flat"
          color="text-hanoon-nash glow-nash"
        />
      </div>

      {/* Equity mini-chart */}
      {data?.equity_history && data.equity_history.length > 0 && (
        <div className="mb-4">
          <div className="glass rounded-2xl p-3">
            <EquityChart history={data.equity_history} />
          </div>
        </div>
      )}

      {/* Tab bar — sticky under the header */}
      <nav className="sticky top-[52px] z-30 mb-4">
        <div className="glass-strong rounded-2xl px-2 py-1.5 flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition
                ${tab === t.key ? 'glass-pill-active text-hanoon-text' : 'glass-pill text-hanoon-text-dim'}`}
            >
              <span className="mr-1 opacity-70">{t.icon}</span>
              {t.label}
              {t.key === 'positions' && positionCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] bg-hanoon-nash/20 text-hanoon-nash">
                  {positionCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <div className="tab-fade">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <div className="xl:col-span-3">
              <OverviewPanel data={data} />
            </div>
            <div className="xl:col-span-1">
              <ControlPanel />
            </div>
            <div className="xl:col-span-4">
              <SystemPanel data={data} />
            </div>
          </div>
        )}

        {tab === 'positions' && (
          <div className="grid grid-cols-1 gap-4">
            <PositionsPanel data={data} />
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

        {tab === 'trades' && (
          <div className="grid grid-cols-1 gap-4">
            <TradesPanel data={data} />
          </div>
        )}

        {tab === 'reflection' && (
          <div className="grid grid-cols-1 gap-4">
            <ReflectionPanel data={data} />
          </div>
        )}

        {tab === 'system' && (
          <div className="grid grid-cols-1 gap-4">
            <SystemPanel data={data} />
          </div>
        )}

        {tab === 'logs' && (
          <div className="grid grid-cols-1 gap-4">
            <LogsPanel data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
