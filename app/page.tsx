'use client';

import { TelemetryProvider, useTelemetry } from '@/components/TelemetryProvider';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';

/**
 * Main Dashboard Page — HANOON 3.0
 *
 * Every signal, metric, and decision is visible on this page:
 * ─────────────────────────────────────────────────────────
 *  L0 Foundations  → Overview Panel (system, components, vault)
 *  L1 Senses       → Positions Panel (live exit health, TBT urgency)
 *  L2 Brains       → Brain Panel (JULI alpha, thinking, Nash, Halim)
 *  L3 Execution    → Trades Panel (fills, brackets)
 *  L3 Risk         → Portfolio stats (in Overview + Header)
 *  L4 Reflection   → Reflection Panel (buffer, review, retrain)
 *  L5 Monitoring   → System Panel (watchdog, sleep, telemetry hub)
 *  L6 Ops          → Control Panel (pause/resume/flatten commands)
 * ─────────────────────────────────────────────────────────
 */

export default function HomePage() {
  return (
    <TelemetryProvider
      pollInterval={Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS) || 5000}
    >
      <AppContent />
    </TelemetryProvider>
  );
}

function AppContent() {
  const { data, connectionState, latencyMs, stale, loading, error, refresh } = useTelemetry();

  const summary = {
    equity: data?.portfolio?.equity ?? data?.equity ?? 0,
    sessionPnl:
      (data?.portfolio?.equity ?? 0) - (data?.portfolio?.peak_equity ?? 0),
    drawdownPct: data?.portfolio?.drawdown ?? 0,
    botAlive: data?.runner?.running ?? data?.api?.running ?? false,
    connectionState,
    uptime: data?.telemetry_hub?.uptime_sec ?? 0,
    ts: data?.ts ?? Math.floor(Date.now() / 1000),
  };

  return (
    <>
      <Header summary={summary} />
      <main className="min-h-[calc(100vh-48px)]">
        {/* Layer status bar */}
        <div className="p-3 border-b border-hanoon-border flex items-center gap-4 text-xs font-mono">
          <StatusIndicator
            label="JULI"
            state="active"
            color="text-hanoon-juli"
          />
          <StatusIndicator
            label="Nash"
            state={data?.nash?.trained ? 'active' : 'inactive'}
            color="text-hanoon-nash"
          />
          <StatusIndicator
            label="Halim"
            state={data?.halim?.active ? 'active' : 'inactive'}
            color="text-hanoon-halim"
          />
          <StatusIndicator
            label="IB Gateway"
            state={data?.vault?.ib_gateway ? 'active' : 'inactive'}
            color="text-hanoon-nash"
          />
          <StatusIndicator
            label="Telemetry"
            state={data?.telemetry_hub?.running ? 'active' : 'inactive'}
            color="text-hanoon-warning"
          />
          <span className="text-hanoon-text-dim ml-auto">
            Latency: {latencyMs}ms · Data: {loading ? 'loading' : stale ? 'STALE' : 'live'}
          </span>
        </div>
        <Dashboard />
      </main>
    </>
  );
}

function StatusIndicator({
  label,
  state,
  color,
}: {
  label: string;
  state: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <div
        className={`w-2 h-2 rounded-full ${
          state === 'active' ? 'bg-current animate-pulse-slow' : 'bg-hanoon-text-dim'
        } ${color}`}
      />
      <span className={color}>{label}</span>
    </div>
  );
}
