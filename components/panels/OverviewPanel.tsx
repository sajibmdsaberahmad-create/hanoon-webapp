'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { formatPrice, formatPercent } from '@/lib/utils';

// ── Overview Panel: L0 bot state, connections, heartbeat ━━━━━━━━━━━━━━━━

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

  return (
    <Panel title="OVERVIEW — Bot & Connection Status" color="hanoon-accent">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
        {/* System metrics */}
        <MetricCard label="CPU" value={`${system.cpu_pct?.toFixed(1)}%`} color={Number(system.cpu_pct) > 70 ? 'text-hanoon-error' : 'text-hanoon-success'} />
        <MetricCard label="Memory" value={`${system.memory_rss_mb?.toFixed(0)}MB`} color={Number(system.memory_rss_mb) > 8000 ? 'text-hanoon-error' : 'text-hanoon-success'} />
        <MetricCard label="Disk" value={`${system.disk_pct?.toFixed(1)}%`} color={Number(system.disk_pct) > 90 ? 'text-hanoon-error' : 'text-hanoon-success'} />

        {/* Connection status */}
        <MetricCard
          label="IB Connected"
          value={component.ib_connected ? 'YES' : 'NO'}
          color={component.ib_connected ? 'text-hanoon-success' : 'text-hanoon-error'}
        />
        <MetricCard
          label="HALIM"
          value={vault.halim_serve ? 'RUNNING' : 'STOPPED'}
          color={vault.halim_serve ? 'text-hanoon-halim' : 'text-hanoon-error'}
        />
        <MetricCard
          label="API Server"
          value={api.running ? 'ON' : 'OFF'}
          color={api.running ? 'text-hanoon-success' : 'text-hanoon-error'}
        />

        {/* Mode indicators */}
        <MetricCard label="Session Phase" value={data.session_phase || '—'} color="text-hanoon-nash" />
        <MetricCard label="Regime" value={data.regime || '—'} color="text-hanoon-warning" />
        <MetricCard
          label="Sleep"
          value={sleep.sleep_state || '—'}
          color="text-hanoon-text-dim"
        />
        <MetricCard
          label="Stress Mode"
          value={data.portfolio?.stress_mode ? 'ACTIVE' : 'OFF'}
          color={data.portfolio?.stress_mode ? 'text-hanoon-error' : 'text-hanoon-success'}
        />
        <MetricCard label="Paused" value={data.paused ? 'YES' : 'NO'} color={data.paused ? 'text-hanoon-warning' : 'text-hanoon-success'} />
        <MetricCard label="Cycles" value={String(runner.cycle_count ?? 0)} color="text-hanoon-text-dim" />
      </div>

      {/* Recent actions */}
      {runner.recent_actions && runner.recent_actions.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-hanoon-text-dim mb-1">Recent Actions</div>
          <div className="space-y-0.5 max-h-24 overflow-y-auto">
            {runner.recent_actions.map((a: any, i) => (
              <div key={i} className="text-xs font-mono">
                <span className="text-hanoon-text-dim">{new Date(a.ts * 1000).toLocaleTimeString()}</span>
                <span className="text-hanoon-nash"> {a.ticker}</span>
                <span className={a.action === 'BUY' ? 'text-hanoon-success' : a.action === 'SELL' ? 'text-hanoon-error' : 'text-hanoon-text-dim'}> {a.action}</span>
                <span className="text-hanoon-text-dim"> score={a.score?.toFixed(4)} dir={a.direction} halim={a.halim?.toFixed(3)} nash={a.nash?.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vault (Halim serve, IB Gateway, Ngrok) */}
      <div className="mt-3 flex gap-4 text-xs">
        <span className={vault.halim_serve ? 'text-hanoon-halim' : 'text-hanoon-error'}>
          HALIM: {vault.halim_serve ? '●' : '○'} serve
        </span>
        <span className={vault.ib_gateway ? 'text-hanoon-nash' : 'text-hanoon-error'}>
          IB: {vault.ib_gateway ? '●' : '○'} gateway
        </span>
        <span className={vault.ngrok ? 'text-hanoon-warning' : 'text-hanoon-error'}>
          NGROK: {vault.ngrok ? '●' : '○'} tunnel
        </span>
      </div>
    </Panel>
  );
}

// ── Panel wrapper ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Panel({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-hanoon-panel border border-hanoon-border rounded p-3 mb-4">
      <div className={`text-xs font-mono mb-2 text-${color}`}>▶ {title}</div>
      {children}
    </div>
  );
}

function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="bg-hanoon-panel border border-hanoon-border rounded p-3 mb-4">
      <div className="text-xs font-mono text-hanoon-text-dim mb-2">▶ {label}</div>
      <div className="animate-pulse">
        <div className="h-3 bg-hanoon-bg rounded w-3/4 mb-1"></div>
        <div className="h-3 bg-hanoon-bg rounded w-1/2"></div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-hanoon-bg rounded p-2 border border-hanoon-border text-center">
      <div className="text-xs text-hanoon-text-dim">{label}</div>
      <div className={`text-sm font-medium ${color || 'text-hanoon-text'}`}>{value}</div>
    </div>
  );
}
