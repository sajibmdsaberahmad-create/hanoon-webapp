'use client';

import { useState, Fragment } from 'react';
import type { TelemetrySnapshot, PositionDetail } from '@/lib/types';
import { formatPrice, formatPercent, pnlColor, healthColor, formatCurrency } from '@/lib/utils';
import { Panel, EmptyState, Skeleton } from '@/components/ui';

/**
 * Positions Panel — L1 Senses: live position health + exit triggers,
 * with what JULI is thinking about each open position (prediction,
 * probability, EV, verdict, indicators) — the pure reflection of the
 * brain's live per-position reasoning.
 */

interface PositionsPanelProps {
  data: TelemetrySnapshot | null;
}

export function PositionsPanel({ data }: PositionsPanelProps) {
  const positions = data?.positions ?? [];
  const urgencies = data?.tbt_rotation?.urgency ?? data?.urgencies ?? {};
  const brackets = data?.brackets ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!data) {
    return (
      <Panel title="Positions">
        <Skeleton className="h-32 w-full" />
      </Panel>
    );
  }

  if (positions.length === 0) {
    return (
      <Panel title="Positions">
        <EmptyState
          title="Portfolio is flat"
          description="No open positions right now. New signals will appear here as they fire."
        />
      </Panel>
    );
  }

  return (
    <Panel
      title="Positions"
      badge={
        <span className="badge badge-info">
          <span className="dot dot-info" />
          {positions.length} open
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Side</th>
              <th className="num">Size</th>
              <th className="num">Entry</th>
              <th className="num">Market</th>
              <th className="num">P&L</th>
              <th className="num">P&L%</th>
              <th className="num">Health</th>
              <th className="num">Verdict</th>
              <th className="num">TBT</th>
              <th className="num">Stop</th>
              <th className="num">Target</th>
              <th className="num">RR</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos: PositionDetail) => {
              const pnlPct =
                ((pos.current_price - pos.avg_cost) / pos.avg_cost) *
                pos.direction *
                100;
              const urgency = urgencies[pos.ticker] ?? 0;

              const healthTone =
                pos.health_verdict === 'EXIT_HARD'
                  ? 'text-hanoon-error'
                  : pos.health_verdict === 'EXIT'
                  ? 'text-hanoon-error'
                  : pos.health_verdict === 'THINK'
                  ? 'text-hanoon-warning'
                  : 'text-hanoon-success';

              return (
                <Fragment key={pos.ticker}>
                <tr
                  onClick={() => setExpanded(expanded === pos.ticker ? null : pos.ticker)}
                  className="cursor-pointer"
                  title="Click for what JULI is thinking about this position"
                >
                  <td className="font-semibold text-hanoon-accent">{pos.ticker}</td>
                  <td>
                    <span className={`badge ${pos.direction > 0 ? 'badge-success' : 'badge-error'}`}>
                      {pos.direction > 0 ? 'Long' : 'Short'}
                    </span>
                  </td>
                  <td className="num">{pos.size.toFixed(2)}</td>
                  <td className="num text-hanoon-text-dim">{formatPrice(pos.avg_cost)}</td>
                  <td className="num">{formatPrice(pos.current_price)}</td>
                  <td className={`num ${pnlColor(pos.pnl)}`}>{formatCurrency(pos.pnl)}</td>
                  <td className={`num ${pnlColor(pnlPct)}`}>{formatPercent(pnlPct)}</td>
                  <td className={`num ${healthColor(pos.health_score ?? 0)}`}>
                    {(pos.health_score ?? 0).toFixed(2)}
                  </td>
                  <td className={`num font-semibold ${healthTone}`}>
                    {pos.health_verdict ?? 'STAY'}
                  </td>
                  <td className="num text-hanoon-text-dim">{urgency.toFixed(2)}</td>
                  <td className="num text-hanoon-error">{formatPrice(pos.stop_price)}</td>
                  <td className="num text-hanoon-success">{formatPrice(pos.target_price)}</td>
                  <td className="num text-hanoon-text-dim">{pos.rr.toFixed(1)}</td>
                </tr>
                {expanded === pos.ticker && (
                  <tr className="bg-black/20">
                    <td colSpan={13} className="p-3">
                      <JuliPositionThinking pos={pos} pnlPct={pnlPct} />
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Exit health legend */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-hanoon-border-soft pt-3 text-[11px] text-hanoon-text-dim">
        <span><span className="text-hanoon-success">STAY</span> — healthy, no exit trigger</span>
        <span><span className="text-hanoon-warning">THINK</span> — consider exit</span>
        <span><span className="text-hanoon-error">EXIT</span> — trigger fired</span>
        <span><span className="text-hanoon-error">EXIT_HARD</span> — stop hit / hard rule</span>
      </div>

      {/* Brackets summary */}
      {brackets.length > 0 && (
        <div className="mt-4">
          <div className="panel-header -mx-1 px-1">
            <div className="panel-title">Brackets</div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {brackets.map((b: any) => (
              <span key={b.ticker} className="badge">
                <span className="font-semibold text-hanoon-accent">{b.ticker}</span>
                <span className="tnum">
                  stop {formatPrice(b.stop_price)} · target {formatPrice(b.target_price)}
                </span>
                <span className="tnum text-hanoon-text-faint">rr {b.rr_ratio?.toFixed(1)}</span>
                {!b.active && <span className="text-hanoon-text-faint">(inactive)</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

/**
 * What JULI is thinking about a single open position — the live exit
 * re-score: prediction, probability, EV, verdict, triggers and the
 * indicator snapshot. Pure reflection of the brain's per-position
 * reasoning; if JULI hasn't scored it yet, the raw entry meta shows.
 */
function JuliPositionThinking({ pos, pnlPct }: { pos: PositionDetail; pnlPct: number }) {
  const t = pos.juli_thinking;
  const inds = t?.indicators ?? {};
  const triggers = t?.triggers ?? {};
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-[11px]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
          <JuliCell label="Prediction" value={t?.prediction ?? '—'} tone={t?.prediction === 'EXIT' ? 'text-hanoon-error' : t?.prediction === 'WATCH' ? 'text-hanoon-warning' : 'text-hanoon-success'} />
          <JuliCell label="Health" value={t ? t.score.toFixed(2) : (pos.health_score ?? 0).toFixed(2)} />
          <JuliCell label="Confidence" value={t ? `${(t.confidence * 100).toFixed(0)}%` : '—'} />
          <JuliCell label="Win prob" value={t ? `${(t.win_prob * 100).toFixed(0)}%` : '—'} />
          <JuliCell label="EV" value={t ? formatCurrency(t.ev_enter) : '—'} tone={t && t.ev_enter > 0 ? 'text-hanoon-success' : t && t.ev_enter < 0 ? 'text-hanoon-error' : ''} />
          <JuliCell label="JULI score" value={t ? t.juli_score.toFixed(3) : '—'} />
          <JuliCell label="Verdict" value={t?.verdict ?? pos.health_verdict ?? 'STAY'} tone={t?.verdict === 'EXIT_HARD' ? 'text-hanoon-error' : t?.verdict === 'EXIT' ? 'text-hanoon-error' : t?.verdict === 'THINK' ? 'text-hanoon-warning' : 'text-hanoon-success'} />
          <JuliCell label="P&L %" value={formatPercent(pnlPct)} tone={pnlColor(pnlPct)} />
        </div>
      </div>
      {Object.keys(triggers).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(triggers).map(([k, v]) => (
            <span key={k} className="badge badge-warning">{k} {typeof v === 'number' ? v.toFixed(3) : ''}</span>
          ))}
        </div>
      )}
      {Object.keys(inds).length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-hanoon-border-soft pt-2 text-[11px] text-hanoon-text-dim">
          {Object.entries(inds).map(([k, v]) => (
            <span key={k} className="tnum"><span className="text-hanoon-text-faint">{k}</span> {typeof v === 'number' ? v.toFixed(3) : v}</span>
          ))}
        </div>
      )}
      {!t && (
        <p className="text-[11px] text-hanoon-text-faint">JULI hasn't re-scored this position yet — showing live market mark. It re-scores every monitor pulse.</p>
      )}
    </div>
  );
}

function JuliCell({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-hanoon-text-faint">{label}</div>
      <div className={`tnum font-semibold ${tone || 'text-hanoon-text'}`}>{value}</div>
    </div>
  );
}
