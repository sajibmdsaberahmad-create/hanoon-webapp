'use client';

import type { TelemetrySnapshot, PositionDetail } from '@/lib/types';
import { formatPrice, formatPercent, pnlColor, healthColor, formatCurrency } from '@/lib/utils';
import { Panel, EmptyState, Skeleton } from '@/components/ui';

/**
 * Positions Panel — L1 Senses: live position health + exit triggers.
 */

interface PositionsPanelProps {
  data: TelemetrySnapshot | null;
}

export function PositionsPanel({ data }: PositionsPanelProps) {
  const positions = data?.positions ?? [];
  const urgencies = data?.tbt_rotation?.urgency ?? data?.urgencies ?? {};
  const brackets = data?.brackets ?? [];

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
                <tr key={pos.ticker}>
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
