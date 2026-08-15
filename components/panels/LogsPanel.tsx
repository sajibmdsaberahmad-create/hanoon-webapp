'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { Panel, Skeleton, EmptyState } from '@/components/ui';

/**
 * Logs Panel — L5/L6: live bot activity, threads, heartbeats.
 */

interface LogsPanelProps {
  data: TelemetrySnapshot | null;
}

export function LogsPanel({ data }: LogsPanelProps) {
  const threads = data?.threads ?? [];
  const recentActions = data?.runner?.recent_actions ?? [];
  const heartbeats = data?.watchdog?.heartbeats ?? {};

  if (!data) {
    return (
      <Panel title="Activity log">
        <Skeleton className="h-40 w-full" />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recent actions */}
      <Panel
        title="Recent actions"
        badge={
          <span className="badge badge-info">
            <span className="dot dot-info" />
            {recentActions.length}
          </span>
        }
      >
        {recentActions.length === 0 ? (
          <EmptyState title="No recent actions" description="The runner hasn't logged any actions yet." />
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {recentActions.map((a: any, i) => (
              <div
                key={i}
                className="log-line flex items-center gap-3 rounded px-2 py-1 hover:bg-white/[0.03]"
              >
                <span className="text-hanoon-text-faint">
                  [{new Date(a.ts * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}]
                </span>
                <span className="font-semibold text-hanoon-accent">{a.ticker}</span>
                <span
                  className={
                    a.action === 'BUY'
                      ? 'font-semibold text-hanoon-success'
                      : a.action === 'SELL'
                      ? 'font-semibold text-hanoon-error'
                      : 'text-hanoon-text-dim'
                  }
                >
                  {a.action}
                </span>
                <span className="text-hanoon-text-faint">score {a.score?.toFixed(4)}</span>
                <span className="text-hanoon-text-faint">dir {a.direction}</span>
                <span className="text-hanoon-halim">halim {a.halim?.toFixed(3)}</span>
                <span className="text-hanoon-nash">nash {a.nash?.toFixed(3)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Threads */}
      {threads.length > 0 && (
        <Panel title="Threads">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {threads.map((t: any) => (
              <div
                key={t.name}
                className="flex items-center justify-between rounded px-2 py-1 text-xs"
              >
                <span className="truncate text-hanoon-text-dim">{t.name}</span>
                <span className="flex items-center gap-1.5">
                  {t.daemon && <span className="text-hanoon-text-faint">daemon</span>}
                  <span className={`badge ${t.alive ? 'badge-success' : 'badge-error'}`}>
                    <span className={`dot ${t.alive ? 'dot-success' : 'dot-error'}`} />
                    {t.alive ? 'alive' : 'dead'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Heartbeats */}
      {Object.keys(heartbeats).length > 0 && (
        <Panel title="Heartbeats">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {Object.entries(heartbeats).map(([name, ts]) => {
              const age = Math.floor((Date.now() / 1000) - Number(ts));
              const ok = age < 60;
              return (
                <div key={name} className="flex items-center justify-between px-2 py-1 text-xs">
                  <span className="truncate text-hanoon-text-dim">{name}</span>
                  <span className="flex items-center gap-2">
                    <span className={`badge ${ok ? 'badge-success' : 'badge-warning'}`}>
                      <span className={`dot ${ok ? 'dot-success' : 'dot-warning'}`} />
                      {age}s ago
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
