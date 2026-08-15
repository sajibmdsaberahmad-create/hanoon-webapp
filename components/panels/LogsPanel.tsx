'use client';

import { useTelemetry } from '@/components/TelemetryProvider';
import type { TelemetrySnapshot } from '@/lib/types';

/**
 * Logs Panel — L6 Ops / L5 Monitoring: shows live bot activity,
 * recent actions, and component heartbeat status.
 *
 * In HANOON 3.0, the bot logs to stdout (hanoon_bot.log). The webapp
 * can't read files directly, but the TelemetryAPI exposes:
 *  - runner.recent_actions (action history)
 *  - threads (thread status)
 *  - watchdog.heartbeats (component liveness)
 *
 * For local dev, the bot's stdout log is tailed via the /api/logs route.
 */

interface LogsPanelProps {
  data: TelemetrySnapshot | null;
}

export function LogsPanel({ data }: LogsPanelProps) {
  const threads = data?.threads ?? [];
  const recentActions = data?.runner?.recent_actions ?? [];
  const heartbeats = data?.watchdog?.heartbeats ?? {};

  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs font-mono text-hanoon-text-dim mb-2">▶ LOGS — Bot Activity</div>

      {/* Thread status */}
      {threads.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-hanoon-text-dim mb-1">Threads</div>
          <div className="space-y-0.5">
            {threads.map((t: any) => (
              <div key={t.name} className="flex justify-between text-xs">
                <span className="text-hanoon-text-dim">{t.name}</span>
                <span className={t.alive ? 'text-hanoon-success' : 'text-hanoon-error'}>
                  {t.alive ? '● alive' : '○ dead'} {t.daemon ? '(daemon)' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heartbeats */}
      {Object.keys(heartbeats).length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-hanoon-text-dim mb-1">Heartbeats</div>
          <div className="space-y-0.5">
            {Object.entries(heartbeats).map(([name, ts]) => (
              <div key={name} className="flex justify-between text-xs">
                <span className="text-hanoon-text-dim">{name}</span>
                <span className="text-hanoon-text-dim">
                  {new Date((ts as number) * 1000).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent actions */}
      {recentActions.length > 0 ? (
        <div>
          <div className="text-xs text-hanoon-text-dim mb-1">Recent Actions</div>
          <div className="space-y-0.5 max-h-32 overflow-y-auto font-mono">
            {recentActions.map((a: any, i) => (
              <div key={i} className="text-xs flex gap-2">
                <span className="text-hanoon-text-dim">
                  [{new Date(a.ts * 1000).toLocaleTimeString()}]
                </span>
                <span className="text-hanoon-accent">{a.ticker}</span>
                <span className={a.action === 'BUY' ? 'text-hanoon-success' : a.action === 'SELL' ? 'text-hanoon-error' : 'text-hanoon-text-dim'}>
                  {a.action}
                </span>
                <span className="text-hanoon-text-dim">
                  score={a.score?.toFixed(4)} dir={a.direction}
                </span>
                <span className="text-hanoon-halim">halim={a.halim?.toFixed(3)}</span>
                <span className="text-hanoon-nash">nash={a.nash?.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-xs text-hanoon-text-dim">No recent actions.</div>
      )}
    </div>
  );
}
