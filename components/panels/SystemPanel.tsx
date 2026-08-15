'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { formatPrice, formatPercent, formatCurrency } from '@/lib/utils';

/**
 * System Panel — L5 Monitoring: system metrics, watchdog, sleep, telemetry.
 *
 * Shows:
 *  - System metrics (CPU, memory, disk)
 *  - Watchdog state (panic mode, IB connected, tick health)
 *  - Sleep state (sleep mode, reason, IB reachability)
 *  - Telemetry hub (running, push interval, uptime)
 *  - Monitoring threads status
 */

interface SystemPanelProps {
  data: TelemetrySnapshot | null;
}

export function SystemPanel({ data }: SystemPanelProps) {
  if (!data) {
    return <PanelPlaceholder label="SYSTEM — Monitoring" />;
  }

  const system = data.system || {};
  const watchdog = data.watchdog || {};
  const sleep = data.sleep || {};
  const telemetryHub = data.telemetry_hub || {};
  const monitor = data.monitor || {};

  return (
    <div className="bg-hanoon-panel border border-hanoon-border rounded p-3 mb-4">
      <div className="text-xs font-mono text-hanoon-warning mb-2">▶ SYSTEM — Monitoring & Health</div>

      {/* System Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div>
          <span className="text-hanoon-text-dim">CPU:</span>
          <span className={system.cpu_pct > 70 ? 'text-hanoon-error' : 'text-hanoon-success'}>
            {system.cpu_pct?.toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-hanoon-text-dim">Memory:</span>
          <span className={system.memory_pct > 80 ? 'text-hanoon-error' : 'text-hanoon-success'}>
            {system.memory_pct?.toFixed(1)}% ({system.memory_rss_mb?.toFixed(0)}MB)
          </span>
        </div>
        <div>
          <span className="text-hanoon-text-dim">Disk:</span>
          <span className={system.disk_pct > 90 ? 'text-hanoon-error' : 'text-hanoon-success'}>
            {system.disk_pct?.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Watchdog */}
      <div className="border-t border-hanoon-border/30 pt-2 mb-2 text-xs">
        <div className="text-xs text-hanoon-text-dim mb-1">Watchdog</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-hanoon-text-dim">Running:</span>
            <span className={watchdog.running ? 'text-hanoon-success' : 'text-hanoon-error'}>
              {watchdog.running ? '●' : '○'}
            </span>
          </div>
          <div>
            <span className="text-hanoon-text-dim">IB Connected:</span>
            <span className={watchdog.ib_connected ? 'text-hanoon-success' : 'text-hanoon-error'}>
              {watchdog.ib_connected ? 'YES' : 'NO'}
            </span>
          </div>
          <div>
            <span className="text-hanoon-text-dim">IB Time Offset:</span>
            <span className={Math.abs(watchdog.ib_time_offset ?? 0) > 2 ? 'text-hanoon-error' : 'text-hanoon-success'}>
              {watchdog.ib_time_offset?.toFixed(2)}s
            </span>
          </div>
          <div>
            <span className="text-hanoon-text-dim">Panic Mode:</span>
            <span className={watchdog.panic_mode ? 'text-hanoon-error' : 'text-hanoon-success'}>
              {watchdog.panic_mode ? 'PANIC' : 'OK'}
            </span>
          </div>
          {watchdog.panic_reason && (
            <div className="col-span-2">
              <span className="text-hanoon-text-dim">Panic Reason:</span>
              <span className="text-hanoon-error">{watchdog.panic_reason}</span>
            </div>
          )}
          <div>
            <span className="text-hanoon-text-dim">Tick Count:</span>
            <span className="text-hanoon-text">{watchdog.tick_count ?? 0}</span>
          </div>
          <div>
            <span className="text-hanoon-text-dim">Stale Ticks:</span>
            <span className={watchdog.stale_ticks > 0 ? 'text-hanoon-error' : 'text-hanoon-success'}>
              {watchdog.stale_ticks ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Sleep State */}
      <div className="border-t border-hanoon-border/30 pt-2 mb-2">
        <div className="text-xs text-hanoon-text-dim mb-1">Sleep Manager</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-hanoon-text-dim">State:</span>
            <span className={
              sleep.sleep_state === 'awake' ? 'text-hanoon-success' :
              sleep.sleep_state === 'weekend' || sleep.sleep_state === 'closed' ? 'text-hanoon-text-dim' :
              'text-hanoon-warning'
            }>{sleep.sleep_state || '—'}</span>
          </div>
          <div>
            <span className="text-hanoon-text-dim">Active:</span>
            <span className={sleep.is_active ? 'text-hanoon-error' : 'text-hanoon-success'}>
              {sleep.is_active ? 'SLEEPING' : 'AWAKE'}
            </span>
          </div>
          {sleep.sleep_reason && (
            <div className="col-span-2">
              <span className="text-hanoon-text-dim">Reason: </span>
              <span className="text-hanoon-text-dim">{sleep.sleep_reason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Position Monitor */}
      {monitor && (
        <div className="border-t border-hanoon-border/30 pt-2 text-xs">
          <div className="text-xs text-hanoon-text-dim mb-1">Position Monitor</div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-hanoon-text-dim">Running:</span>
              <span className={monitor.running ? 'text-hanoon-success' : 'text-hanoon-error'}>
                {monitor.running ? '●' : '○'}
              </span>
            </div>
            <div>
              <span className="text-hanoon-text-dim">Pulse:</span>
              <span className="text-hanoon-text">{monitor.pulse_sec}s</span>
            </div>
            <div>
              <span className="text-hanoon-text-dim">Positions:</span>
              <span className="text-hanoon-text">{monitor.positions_monitored ?? 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Telemetry Hub */}
      {telemetryHub && (
        <div className="border-t border-hanoon-border/30 pt-2 mt-2 text-xs">
          <div className="text-xs text-hanoon-text-dim">
            Telemetry Hub: {telemetryHub.running ? '● running' : '○ stopped'}
            · push: {telemetryHub.push_interval}s
            · history: {telemetryHub.history_size}
            · uptime: {Math.floor(telemetryHub.uptime_sec)}s
          </div>
        </div>
      )}
    </div>
  );
}

function PanelPlaceholder({ label }: { label: string }) {
  return (
    <div className="bg-hanoon-panel border border-hanoon-border rounded p-3 mb-4">
      <div className="text-xs font-mono text-hanoon-text-dim mb-2">▶ {label}</div>
      <div className="text-xs text-hanoon-text-dim">Loading system state…</div>
    </div>
  );
}
