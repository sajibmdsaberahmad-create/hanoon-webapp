'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { formatPrice, formatPercent } from '@/lib/utils';
import { Panel, StatCard, Skeleton } from '@/components/ui';

/**
 * Overview Panel — L0 foundations: equity, portfolio risk, component health.
 */

interface OverviewPanelProps {
  data: TelemetrySnapshot | null;
}

export function OverviewPanel({ data }: OverviewPanelProps) {
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Portfolio</div>
          </div>
          <div className="panel-body">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-2 h-3 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">System health</div>
          </div>
          <div className="panel-body">
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const system = data.system || {};
  const component = data.component_status || {};
  const sleep = data.sleep || {};
  const runner = data.runner || {};
  const api = data.api || {};
  const vault = data.vault || {};
  const portfolio = data.portfolio || {};

  const equity = data.equity ?? portfolio.equity ?? 0;
  const sessionPnl = data.session_pnl ?? 0;
  const drawdown = data.drawdown_pct ?? portfolio.drawdown ?? 0;

  const healthTiles = [
    {
      label: 'CPU',
      value: `${(system.cpu_pct ?? 0).toFixed(1)}%`,
      ok: (system.cpu_pct ?? 0) <= 70,
    },
    {
      label: 'Memory',
      value: `${(system.memory_rss_mb ?? 0).toFixed(0)}MB`,
      ok: (system.memory_rss_mb ?? 0) <= 8000,
    },
    {
      label: 'Disk',
      value: `${(system.disk_pct ?? 0).toFixed(1)}%`,
      ok: (system.disk_pct ?? 0) <= 90,
    },
    {
      label: 'IB gateway',
      value: component.ib_connected ? 'Connected' : 'Disconnected',
      ok: !!component.ib_connected,
    },
    {
      label: 'Halim serve',
      value: vault.halim_serve ? 'Running' : 'Stopped',
      ok: !!vault.halim_serve,
    },
    {
      label: 'API server',
      value: api.running ? 'Online' : 'Offline',
      ok: !!api.running,
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── Portfolio hero ── */}
      <Panel title="Portfolio">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Equity"
            value={formatPrice(equity)}
            tone="accent"
          />
          <StatCard
            label="Session P&L"
            value={`${sessionPnl >= 0 ? '+' : ''}${formatPrice(sessionPnl)}`}
            tone={sessionPnl >= 0 ? 'success' : 'error'}
          />
          <StatCard
            label="Peak equity"
            value={formatPrice(portfolio.peak_equity ?? equity)}
          />
          <StatCard
            label="Drawdown"
            value={formatPercent(drawdown)}
            tone={
              drawdown > 5 ? 'error' : drawdown > 2 ? 'warning' : 'default'
            }
          />
        </div>

        {/* Chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="badge">
            Realized&nbsp;
            <span className={(portfolio as any).realized_pnl >= 0 ? 'text-hanoon-success' : 'text-hanoon-error'}>
              {formatPrice((portfolio as any).realized_pnl ?? 0)}
            </span>
          </span>
          <span className="badge">
            Trades&nbsp;<span className="tnum text-hanoon-text">{data.buffer?.trade_count ?? 0}</span>
          </span>
          <span className="badge">
            Win rate&nbsp;
            <span className="text-hanoon-success">
              {formatPercent((data.buffer?.win_rate ?? 0) * 100)}
            </span>
          </span>
          <span className="badge">
            Exposure&nbsp;
            <span className="text-hanoon-nash">{formatPercent(portfolio.exposure ?? 0)}</span>
          </span>
          <span className="badge">
            Positions&nbsp;
            <span className="tnum text-hanoon-accent">{data.positions?.length ?? 0}</span>
          </span>
        </div>
      </Panel>

      {/* ── Component health ── */}
      <Panel title="System health">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {healthTiles.map((t) => (
            <div key={t.label} className="inner-surface px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="metric-label">{t.label}</span>
                <span className={`dot ${t.ok ? 'dot-success' : 'dot-error'}`} />
              </div>
              <div className={`tnum mt-1 text-sm font-semibold ${t.ok ? 'text-hanoon-text' : 'text-hanoon-error'}`}>
                {t.value}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Mode & vault ── */}
      <Panel title="Mode & vault">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Session phase" value={data.session_phase || '—'} tone="info" />
          <StatCard label="Regime" value={data.regime || '—'} tone="warning" />
          <StatCard
            label="Sleep state"
            value={sleep.sleep_state || '—'}
            hint={sleep.sleep_reason}
            tone={sleep.is_active ? 'warning' : 'success'}
          />
          <StatCard
            label="Paused"
            value={data.paused ? 'Yes' : 'No'}
            tone={data.paused ? 'warning' : 'success'}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-hanoon-text-dim">
          <span className="flex items-center gap-1.5">
            <span className={`dot ${vault.halim_serve ? 'dot-halim' : 'dot-error'}`} />
            Halim serve
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`dot ${vault.ib_gateway ? 'dot-info' : 'dot-error'}`} />
            IB gateway
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`dot ${(vault.tunnel ?? vault.ngrok) ? 'dot-warning' : 'dot-error'}`} />
            Tunnel
          </span>
          <span className="tnum">Cycles: {runner.cycle_count ?? 0}</span>
        </div>
      </Panel>

      {/* ── Recent actions ── */}
      {runner.recent_actions && runner.recent_actions.length > 0 && (
        <Panel title="Recent actions">
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {runner.recent_actions.map((a: any, i) => (
              <div
                key={i}
                className="log-line flex items-center gap-2 rounded px-2 py-1 hover:bg-white/[0.03]"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="text-hanoon-text-faint">
                  {new Date(a.ts * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className="font-semibold text-hanoon-nash">{a.ticker}</span>
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
                <span className="ml-auto text-hanoon-text-faint">
                  score {a.score?.toFixed(4)} · halim {a.halim?.toFixed(3)} · nash{' '}
                  {a.nash?.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
