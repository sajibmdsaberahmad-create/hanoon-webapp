'use client';

import { useTelemetry } from '@/components/TelemetryProvider';
import { ControlPanel, EquityChart, StatCard } from '@/components/ui';
import { formatPrice, formatPercent, formatCurrency } from '@/lib/utils';
import { OverviewPanel } from '@/components/panels/OverviewPanel';
import { PositionsPanel } from '@/components/panels/PositionsPanel';
import { BrainPanel } from '@/components/panels/BrainPanel';
import { TradesPanel } from '@/components/panels/TradesPanel';
import { SystemPanel } from '@/components/panels/SystemPanel';
import { ReflectionPanel } from '@/components/panels/ReflectionPanel';
import { ReconnectingProvider } from '@/components/ReconnectingProvider';
import { ReconnectionBanner } from '@/components/ReconnectingProvider';

// ── Main Dashboard ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function Dashboard() {
  const { data, connectionState, latencyMs, stale, loading, error } = useTelemetry();

  if (!data && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-hanoon-text-dim">
        <div className="text-center">
          <div className="text-2xl mb-2">🚀</div>
          <div>Connecting to HANOON 3.0…</div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-hanoon-error">
        <div className="text-center">
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
  const peak = data?.portfolio?.peak_equity ?? 0;
  const drawdown = data?.portfolio?.drawdown ?? 0;
  const sessionPnl = data?.session_pnl ?? (data?.portfolio ? equity - (data?.portfolio?.peak_equity ?? equity) : 0);
  const riskScalar = data?.portfolio?.risk_scalar ?? 0;
  const stressMode = data?.portfolio?.stress_mode ?? false;

  return (
    <div className="p-4">
      <ReconnectionBanner state={connectionState} error={error} latency={latencyMs} stale={stale} />

      {/* Header summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Equity" value={formatPrice(equity)} trend="up" color="text-hanoon-accent" />
        <StatCard label="Drawdown" value={formatPercent(drawdown)} trend="down" color={drawdown > 0.2 ? 'text-hanoon-error' : 'text-hanoon-warning'} />
        <StatCard label="Risk Scalar" value={riskScalar.toFixed(2)} trend="flat" color={stressMode ? 'text-hanoon-error' : 'text-hanoon-success'} />
        <StatCard label="Positions" value={String(data?.positions?.length ?? 0)} trend="flat" color="text-hanoon-nash" />
      </div>

      {/* Equity mini-chart */}
      {data?.equity_history && data.equity_history.length > 0 && (
        <div className="mb-4">
          <EquityChart history={data.equity_history} />
        </div>
      )}

      {/* Control Panel */}
      <div className="mb-4">
        <ControlPanel />
      </div>

      {/* Main grid — 10 layers of monitoring */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* L0: Overview (bot state, connections, heartbeat) */}
        <div className="xl:col-span-4">
          <OverviewPanel data={data} />
        </div>

        {/* L1: Positions — live position health + exit triggers */}
        <div className="xl:col-span-2">
          <PositionsPanel data={data} />
        </div>

        {/* L2: Brain — JULI composite, thinking, signals  */}
        <div className="xl:col-span-2">
          <BrainPanel data={data} />
        </div>

        {/* L3: Trades — buffer + live trades */}
        <div className="xl:col-span-4">
          <TradesPanel data={data} />
        </div>

        {/* L4: Reflection — buffer, review, retrain */}
        <div className="xl:col-span-2">
          <ReflectionPanel data={data} />
        </div>

        {/* L5: System — CPU/mem/disk, watchdog, sleep */}
        <div className="xl:col-span-2">
          <SystemPanel data={data} />
        </div>
      </div>
    </div>
  );
}
