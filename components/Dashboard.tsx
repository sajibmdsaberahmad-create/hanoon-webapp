'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Squares2X2Icon,
  CpuChipIcon,
  ChartBarIcon,
  ArrowsRightLeftIcon,
  CommandLineIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useTelemetry } from '@/components/TelemetryProvider';
import { ReconnectionBanner } from '@/components/ReconnectingProvider';
import { EquityChart, StatCard, EmptyState } from '@/components/ui';
import { CommandCenter } from '@/components/CommandCenter';
import { OverviewPanel } from '@/components/panels/OverviewPanel';
import { PositionsPanel } from '@/components/panels/PositionsPanel';
import { BrainPanel } from '@/components/panels/BrainPanel';
import { TradesPanel } from '@/components/panels/TradesPanel';
import { ReflectionPanel } from '@/components/panels/ReflectionPanel';
import { SystemPanel } from '@/components/panels/SystemPanel';
import { LogsPanel } from '@/components/panels/LogsPanel';
import { SignalSpectrum } from '@/components/SignalSpectrum';
import { EnginePanel } from '@/components/panels/EnginePanel';

/**
 * Dashboard — tabbed command shell.
 *
 * Tabs map to HANOON layers:
 *   Overview · Brain · Positions · Trades · Control · System · Logs
 *
 * Tab state lives in the URL hash (#trades) so refresh/back/forward work.
 * Badges show live counts (positions / predictions / trades).
 */

type TabKey =
  | 'overview'
  | 'brain'
  | 'positions'
  | 'engine'
  | 'trades'
  | 'control'
  | 'system'
  | 'logs';

const TABS: Array<{ id: TabKey; label: string; icon: typeof Squares2X2Icon }> = [
  { id: 'overview', label: 'Overview', icon: Squares2X2Icon },
  { id: 'brain', label: 'Brain', icon: CpuChipIcon },
  { id: 'positions', label: 'Positions', icon: ChartBarIcon },
  { id: 'engine', label: 'Engine', icon: BoltIcon },
  { id: 'trades', label: 'Trades', icon: ArrowsRightLeftIcon },
  { id: 'control', label: 'Control', icon: CommandLineIcon },
  { id: 'system', label: 'System', icon: Cog6ToothIcon },
  { id: 'logs', label: 'Logs', icon: DocumentTextIcon },
];

function tabFromHash(): TabKey {
  if (typeof window === 'undefined') return 'overview';
  const h = window.location.hash.replace('#', '');
  return TABS.some((t) => t.id === h) ? (h as TabKey) : 'overview';
}

export function Dashboard() {
  const { data, connectionState, latencyMs, stale, loading, error, refresh } =
    useTelemetry();
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-fade-in-up flex flex-col items-center gap-3 text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-hanoon-accent" />
          <div className="text-sm text-hanoon-text-dim">
            Connecting to HANOON 3.0…
          </div>
          <div className="text-xs text-hanoon-text-faint">
            Contacting the telemetry bridge
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="w-full max-w-md animate-fade-in-up">
          <EmptyState
            title="Bridge unreachable"
            description={`Unable to reach the HANOON telemetry bridge. Make sure the bot is running. (${error})`}
          />
          <div className="mt-4 text-center">
            <button onClick={refresh} className="btn">
              <ArrowPathIcon className="h-4 w-4" />
              Retry
            </button>
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
    <div className="animate-fade-in">
      <ReconnectionBanner
        state={connectionState}
        error={error}
        latency={latencyMs}
        stale={stale}
      />

      {/* ── Tab bar ── */}
      <nav className="sticky top-[60px] z-30 -mx-4 border-b border-hanoon-border bg-hanoon-bg/85 px-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="scrollbar-none -mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.id;
            const badge = badges[t.id];
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`
                  flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition-colors
                  ${
                    active
                      ? 'border-hanoon-accent text-hanoon-text'
                      : 'border-transparent text-hanoon-text-dim hover:border-hanoon-border hover:text-hanoon-text'
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-hanoon-accent' : ''}`} />
                {t.label}
                {badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      active
                        ? 'bg-hanoon-accent/15 text-hanoon-accent'
                        : 'bg-hanoon-border/60 text-hanoon-text-dim'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Active panel ── */}
      <div className="py-5">
        <div key={tab} className="animate-fade-in-up">
          {tab === 'overview' && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <OverviewPanel data={data} />
              </div>
              <div className="space-y-4">
                <StatCard label="Equity" value={equity.toFixed(2)} unit="USD" tone="accent" />
                <StatCard
                  label="Drawdown"
                  value={`${(drawdown * 100).toFixed(2)}%`}
                  tone={drawdown > 0.2 ? 'error' : drawdown > 0.1 ? 'warning' : 'default'}
                />
                <StatCard
                  label="Risk scalar"
                  value={riskScalar.toFixed(2)}
                  hint={data?.portfolio?.stress_mode ? 'Stress mode active' : 'Normal mode'}
                  tone={data?.portfolio?.stress_mode ? 'error' : 'success'}
                />
                <StatCard label="Open positions" value={String(positionCount)} tone="info" />
                {data?.equity_history && data.equity_history.length > 1 && (
                  <div className="panel">
                    <div className="panel-body">
                      <EquityChart history={data.equity_history} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {tab === 'brain' && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <BrainPanel data={data} />
              <div className="space-y-4">
                <SignalSpectrum data={data} />
              </div>
            </div>
          )}
          {tab === 'positions' && <PositionsPanel data={data} />}
          {tab === 'engine' && <EnginePanel />}
          {tab === 'trades' && <TradesPanel data={data} />}
          {tab === 'control' && <CommandCenter />}
          {tab === 'system' && <SystemPanel data={data} />}
          {tab === 'logs' && <LogsPanel data={data} />}
        </div>
      </div>
    </div>
  );
}
