'use client';

import { useEffect, useState } from 'react';
import type { EngineStatus } from '@/lib/types';
import { getBridgeClient } from '@/lib/api';
import { Panel, StatCard, EmptyState, Skeleton } from '@/components/ui';

/**
 * Engine Panel — Map B live engine (HUNTER telemetry /api/engine).
 *
 * Fetches itself via the verbatim bridge (/api/bridge/api/engine -> bot
 * /api/engine) so the HANOON-bot panels stay untouched. All values are
 * projected read-only from logs/engine_status.json; a missing or stale
 * file renders as UNKNOWN, never as flat.
 */

const POLL_MS = 5000;

function timeAgo(ts: number | null | undefined): string {
  if (!ts) return '—';
  const s = Math.max(0, Math.round(Date.now() / 1000 - ts));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function EnginePanel() {
  const [data, setData] = useState<EngineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    const client = getBridgeClient();
    const poll = async () => {
      const res = await client.fetchEndpoint('/api/engine', 1, 500);
      if (dead) return;
      if (res.ok && res.data) {
        setData(res.data as EngineStatus);
        setError(null);
      } else {
        setError(res.error);
      }
      setLoading(false);
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      dead = true;
      clearInterval(id);
    };
  }, []);

  if (loading && !data) {
    return (
      <Panel title="Map B Engine">
        <Skeleton className="h-32 w-full" />
      </Panel>
    );
  }

  if (error && !data) {
    return (
      <Panel title="Map B Engine">
        <EmptyState
          title="Engine telemetry unreachable"
          description={error ?? 'The bridge returned no data.'}
        />
      </Panel>
    );
  }

  if (!data || data.present === false) {
    return (
      <Panel title="Map B Engine">
        <EmptyState
          title="Engine state unknown"
          description="No engine status on disk — the engine never wrote one. This is not the same as flat."
        />
      </Panel>
    );
  }

  const stale = data.stale === true;
  const positions = data.positions ?? [];
  const vetoes = Object.entries(data.vetoes ?? {}).sort((a, b) => b[1] - a[1]);
  const topVetoes = vetoes.slice(0, 6);

  return (
    <div className="space-y-4">
      {stale && (
        <Panel title="Stale">
          <EmptyState
            title="Status file is stale"
            description={`Last write ${timeAgo(data.ts)} (age ${data.file_age_s ?? '?'}s). Showing the previous session — treat as unknown, not live.`}
          />
        </Panel>
      )}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Daily P&L"
          value={data.daily_pnl >= 0 ? `+${data.daily_pnl.toFixed(2)}` : data.daily_pnl.toFixed(2)}
          unit="USD"
          tone={data.daily_pnl >= 0 ? 'success' : 'error'}
        />
        <StatCard label="Entries (engine/day)" value={`${data.entries_all}`} hint="cap 6/day, 1/symbol/day" tone="info" />
        <StatCard label="Stages" value={String(data.stages)} tone="default" />
        <StatCard
          label="Universe"
          value={data.universe ? String(data.universe.length) : '—'}
          hint={data.universe_source ? `source: ${data.universe_source}` : undefined}
          tone="accent"
        />
      </div>

      <Panel
        title="Universe"
        badge={
          <span className="badge badge-info">
            <span className="dot dot-info" />
            {data.universe_source ?? 'unknown source'}
          </span>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {(data.universe ?? []).map((s) => (
            <span key={s} className="rounded bg-hanoon-border/60 px-2 py-0.5 text-xs font-semibold">
              {s}
            </span>
          ))}
          {(data.universe ?? []).length === 0 && (
            <span className="text-xs text-hanoon-text-faint">no symbols</span>
          )}
        </div>
        {data.staged.length > 0 && (
          <div className="mt-2 text-xs">
            <span className="text-hanoon-text-faint">staged: </span>
            {data.staged.join(', ')}
          </div>
        )}
      </Panel>

      <Panel
        title="Positions"
        badge={
          <span className="badge badge-info">
            <span className="dot dot-info" />
            {positions.length} open
          </span>
        }
      >
        {positions.length === 0 ? (
          <EmptyState
            title="No open positions"
            description="Flat right now. New fills appear here with their live stop/target rails."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th className="num">Qty</th>
                  <th className="num">Entry</th>
                  <th className="num">Stop</th>
                  <th className="num">Target</th>
                  <th className="num">High-water</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.symbol}>
                    <td className="font-semibold">{p.symbol}</td>
                    <td className="num">{p.qty ?? '—'}</td>
                    <td className="num">{p.entry.toFixed(4)}</td>
                    <td className="num">{p.stop.toFixed(4)}</td>
                    <td className="num">{p.target.toFixed(4)}</td>
                    <td className="num">{p.hw.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Top vetoes">
          {topVetoes.length === 0 ? (
            <div className="text-xs text-hanoon-text-faint">no vetoes counted yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reason</th>
                    <th className="num">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topVetoes.map(([reason, n]) => (
                    <tr key={reason}>
                      <td className="font-mono text-xs">{reason}</td>
                      <td className="num">{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Last action">
          {!data.last_action ? (
            <div className="text-xs text-hanoon-text-faint">no bar actions yet</div>
          ) : (
            <div className="text-xs">
              <span className="font-semibold">{data.last_action.symbol}</span>{' '}
              <span className="font-mono">{data.last_action.action}</span>{' '}
              <span className="font-mono text-hanoon-text-dim">({data.last_action.reason})</span>{' '}
              <span className="text-hanoon-text-faint">{timeAgo(data.last_action.ts)}</span>
            </div>
          )}
          <div className="mt-2 text-[11px] text-hanoon-text-faint">
            engine pid {data.pid} · status {timeAgo(data.ts)} · file age {data.file_age_s ?? '?'}s
          </div>
        </Panel>
      </div>
    </div>
  );
}
