'use client';

import { useTelemetry } from '@/components/TelemetryProvider';
import { Header } from '@/components/Header';
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
 * Main Dashboard — composited grid of all 10 HANOON layers.
 *
 * Layout (responsive):
 *   L0 Overview (full width)  → bot state, components, vault, system metrics
 *   L1 Positions (half)       → live position health + exit triggers + TBT urgency
 *   L2 Brain (half)             → JULI alpha, thinking, Nash, Halim, debate
 *   Signal Spectrum (full)      → live JULI signal strength bars
 *   L3 Trades (full)            → fills, brackets, buffer stats
 *   L4 Reflection (half)        → buffer, review, retrain, supervisor
 *   L5 System (half)            → CPU/mem/disk, watchdog, sleep, telemetry
 *
 * Every single signal and metric from the bot is visible here.
 */

export function Dashboard() {
  const { data, connectionState, latencyMs, stale, loading, error, refresh } = useTelemetry();

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
  const drawdown = data?.portfolio?.drawdown ?? 0;
  const riskScalar = data?.portfolio?.risk_scalar ?? 0;
  const botAlive = data?.runner?.running ?? data?.api?.running ?? false;

  return (
    <div className="p-4">
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
          color="text-hanoon-accent"
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
          value={String(data?.positions?.length ?? 0)}
          trend="flat"
          color="text-hanoon-nash"
        />
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

      {/* Main grid — all 10 layers */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* L0: Overview (bot state, connections, system) */}
        <div className="xl:col-span-4">
          <OverviewPanel data={data} />
        </div>

        {/* L1: Positions (live position health + exit triggers) */}
        <div className="xl:col-span-2">
          <PositionsPanel data={data} />
        </div>

        {/* L2: Brain (JULI alpha, thinking, Nash, Halim, debate) */}
        <div className="xl:col-span-2">
          <BrainPanel data={data} />
        </div>

        {/* Signal Spectrum (live JULI signal strength) */}
        <div className="xl:col-span-4">
          <SignalSpectrum data={data} />
        </div>

        {/* L3: Trades (fills, brackets, buffer) */}
        <div className="xl:col-span-4">
          <TradesPanel data={data} />
        </div>

        {/* L4: Reflection (buffer, review, retrain) */}
        <div className="xl:col-span-2">
          <ReflectionPanel data={data} />
        </div>

        {/* L5: System (CPU/mem/disk, watchdog, sleep, telemetry) */}
        <div className="xl:col-span-2">
          <SystemPanel data={data} />
        </div>

        {/* L6: Logs (threads, heartbeats, recent actions) */}
        <div className="xl:col-span-4">
          <LogsPanel data={data} />
        </div>
      </div>
    </div>
  );
}
