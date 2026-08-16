'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { Panel, StatCard, Skeleton } from '@/components/ui';

/**
 * System Panel — L5 Monitoring: system metrics, watchdog, sleep, telemetry.
 */

interface SystemPanelProps {
  data: TelemetrySnapshot | null;
}

export function SystemPanel({ data }: SystemPanelProps) {
  if (!data) {
    return (
      <Panel title="System">
        <Skeleton className="h-32 w-full" />
      </Panel>
    );
  }

  const system = data.system || {};
  const watchdog = data.watchdog || {};
  const sleep = data.sleep || {};
  const telemetryHub = data.telemetry_hub || {};
  const monitor = data.monitor || {};

  return (
    <div className="space-y-4">
      {/* System metrics */}
      <Panel title="Machine">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="CPU"
            value={`${(system.cpu_pct ?? 0).toFixed(1)}%`}
            tone={(system.cpu_pct ?? 0) > 70 ? 'error' : 'success'}
          />
          <StatCard
            label="Memory"
            value={`${(system.memory_pct ?? 0).toFixed(1)}%`}
            hint={`${(system.memory_rss_mb ?? 0).toFixed(0)}MB RSS`}
            tone={(system.memory_pct ?? 0) > 80 ? 'error' : 'success'}
          />
          <StatCard
            label="Disk"
            value={`${(system.disk_pct ?? 0).toFixed(1)}%`}
            tone={(system.disk_pct ?? 0) > 90 ? 'error' : 'success'}
          />
          <StatCard
            label="Uptime"
            value={`${Math.floor(data.uptime_sec ?? 0)}s`}
          />
        </div>
      </Panel>

      {/* Watchdog */}
      <Panel title="Watchdog">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Running"
            value={watchdog.running ? 'Yes' : 'No'}
            tone={watchdog.running ? 'success' : 'error'}
          />
          <StatCard
            label="IB connected"
            value={watchdog.ib_connected ? 'Yes' : 'No'}
            tone={watchdog.ib_connected ? 'success' : 'error'}
          />
          <StatCard
            label="IB time offset"
            value={`${(watchdog.ib_time_offset ?? 0).toFixed(2)}s`}
            tone={Math.abs(watchdog.ib_time_offset ?? 0) > 2 ? 'error' : 'success'}
          />
          <StatCard
            label="Panic mode"
            value={watchdog.panic_mode ? 'PANIC' : 'OK'}
            tone={watchdog.panic_mode ? 'error' : 'success'}
          />
          <StatCard label="Tick count" value={String(watchdog.tick_count ?? 0)} />
          <StatCard
            label="Stale ticks"
            value={String(watchdog.stale_ticks ?? 0)}
            tone={(watchdog.stale_ticks ?? 0) > 0 ? 'error' : 'success'}
          />
        </div>
        {watchdog.panic_reason && (
          <div className="mt-3 rounded-lg border border-hanoon-error/30 bg-hanoon-error/5 px-3 py-2 text-xs text-hanoon-error">
            {watchdog.panic_reason}
          </div>
        )}
      </Panel>

      {/* Sleep manager */}
      <Panel title="Sleep manager">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="State"
            value={sleep.sleep_state || '—'}
            tone={sleep.sleep_state === 'awake' ? 'success' : 'warning'}
          />
          <StatCard
            label="Active"
            value={sleep.is_active ? 'Awake' : 'Sleeping'}
            tone={sleep.is_active ? 'success' : 'warning'}
          />
          <StatCard
            label="Sessions"
            value={(sleep.enabled_sessions || ['rth']).join(', ')}
          />
          <StatCard
            label="Last check"
            value={
              sleep.last_check
                ? new Date(sleep.last_check * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'
            }
          />
          <StatCard
            label="IB reachable"
            value={(data as any)?.sleep?.ib_reachable ? 'Yes' : 'Unknown'}
          />
        </div>
        {sleep.sleep_reason && (
          <div className="mt-3 text-xs text-hanoon-text-dim">
            Reason: {sleep.sleep_reason}
          </div>
        )}
      </Panel>

      {/* Position monitor + telemetry hub */}
      {monitor && (
        <Panel title="Position monitor">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Running"
              value={monitor.running ? 'Yes' : 'No'}
              tone={monitor.running ? 'success' : 'error'}
            />
            <StatCard label="Pulse" value={`${monitor.pulse_sec}s`} />
            <StatCard label="Monitored" value={String(monitor.positions_monitored ?? 0)} />
            <StatCard label="Brackets" value={String(Object.keys(monitor.brackets ?? {}).length)} />
          </div>
        </Panel>
      )}

      {telemetryHub && (
        <Panel title="Telemetry hub">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Running"
              value={telemetryHub.running ? 'Yes' : 'No'}
              tone={telemetryHub.running ? 'success' : 'error'}
            />
            <StatCard label="Push interval" value={`${telemetryHub.push_interval}s`} />
            <StatCard label="History size" value={String(telemetryHub.history_size ?? 0)} />
            <StatCard
              label="Uptime"
              value={`${Math.floor(telemetryHub.uptime_sec ?? 0)}s`}
            />
          </div>
        </Panel>
      )}
    </div>
  );
}
