'use client';

import { TelemetryProvider, useTelemetry } from '@/components/TelemetryProvider';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { LayerStatusBar } from '@/components/ui';

/**
 * HANOON 3.0 — Command Dashboard
 *
 * L0  Foundations  → Overview
 * L1  Senses       → Positions (live exit health, TBT urgency)
 * L2  Brains       → Brain (JULI / thinking / Nash / Halim)
 * L3  Execution    → Trades (fills, brackets)
 * L4  Reflection   → Reflection (buffer, review, retrain)
 * L5  Monitoring   → System (watchdog, sleep, telemetry hub)
 * L6  Ops          → Command Center (pause / resume / flatten)
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
  const { data, connectionState, latencyMs, stale, loading, error, refresh } =
    useTelemetry();

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
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-10">
        <div className="pt-3">
          <LayerStatusBar
            data={data}
            latencyMs={latencyMs}
            stale={stale}
            loading={loading}
            error={error}
          />
        </div>
        <div className="mt-4">
          <Dashboard />
        </div>
      </main>
    </>
  );
}
