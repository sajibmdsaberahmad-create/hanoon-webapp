'use client';

import type { TelemetrySnapshot, PositionDetail } from '@/lib/types';
import { formatPrice, formatPercent, pnlColor, healthColor, formatCurrency } from '@/lib/utils';

/**
 * Positions Panel — L1 Senses: live position health + exit triggers.
 *
 * Shows every active position with:
 *  - Real-time P&L (from IB)
 *  - Exit health re-score (from JULI cognitive.exit_re score)
 *  - Health verdict (STAY / THINK / EXIT / EXIT_HARD)
 *  - TBT rotation urgency (the priority ranking for tick-by-tick feed)
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
      <div className="bg-hanoon-panel border border-hanoon-border rounded p-3 mb-4">
        <div className="text-xs font-mono text-hanoon-text-dim mb-2">▶ POSITIONS</div>
        <div className="text-xs text-hanoon-text-dim">Loading positions…</div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="bg-hanoon-panel border border-hanoon-border rounded p-3 mb-4">
        <div className="text-xs font-mono text-hanoon-text-dim mb-2">▶ POSITIONS</div>
        <div className="text-xs text-hanoon-text-dim">No open positions. Portfolio is flat.</div>
      </div>
    );
  }

  return (
    <div className="bg-hanoon-panel border border-hanoon-border rounded p-3 mb-4">
      <div className="text-xs font-mono text-hanoon-nash mb-2">▶ POSITIONS ({positions.length})</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-hanoon-border">
              <th className="text-left py-1 text-hanoon-text-dim">Ticker</th>
              <th className="text-right py-1 text-hanoon-text-dim">Dir</th>
              <th className="text-right py-1 text-hanoon-text-dim">Size</th>
              <th className="text-right py-1 text-hanoon-text-dim">Entry</th>
              <th className="text-right py-1 text-hanoon-text-dim">Market</th>
              <th className="text-right py-1 text-hanoon-text-dim">P&L</th>
              <th className="text-right py-1 text-hanoon-text-dim">P&L%</th>
              <th className="text-right py-1 text-hanoon-text-dim">Health</th>
              <th className="text-right py-1 text-hanoon-text-dim">Verdict</th>
              <th className="text-right py-1 text-hanoon-text-dim">TBT Urg</th>
              <th className="text-right py-1 text-hanoon-text-dim">Stop</th>
              <th className="text-right py-1 text-hanoon-text-dim">Target</th>
              <th className="text-right py-1 text-hanoon-text-dim">RR</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos: PositionDetail) => {
              const pnlPct = ((pos.current_price - pos.avg_cost) / pos.avg_cost) * pos.direction * 100;
              const urgency = urgencies[pos.ticker] ?? 0;
              const bracket = brackets.find((b: any) => b.ticker === pos.ticker);

              return (
                <tr key={pos.ticker} className="border-b border-hanoon-border/30 hover:bg-hanoon-bg/30">
                  <td className="py-1 text-hanoon-accent">{pos.ticker}</td>
                  <td className="text-right">{pos.direction > 0 ? '🟢 LONG' : '🔴 SHORT'}</td>
                  <td className="text-right">{pos.size.toFixed(2)}</td>
                  <td className="text-right text-hanoon-text-dim">{formatPrice(pos.avg_cost)}</td>
                  <td className="text-right">{formatPrice(pos.current_price)}</td>
                  <td className={`text-right ${pnlColor(pos.pnl)}`}>{formatCurrency(pos.pnl)}</td>
                  <td className={`text-right ${pnlColor(pnlPct)}`}>{formatPercent(pnlPct)}</td>
                  <td className={`text-right ${healthColor(pos.health_score ?? 0)}`}>
                    {(pos.health_score ?? 0).toFixed(2)}
                  </td>
                  <td className="text-right">
                    <span className={
                      pos.health_verdict === 'EXIT_HARD' ? 'text-hanoon-error' :
                      pos.health_verdict === 'EXIT' ? 'text-hanoon-error' :
                      pos.health_verdict === 'THINK' ? 'text-hanoon-warning' :
                      'text-hanoon-success'
                    }>{pos.health_verdict ?? 'STAY'}</span>
                  </td>
                  <td className="text-right text-hanoon-text-dim">{urgency.toFixed(2)}</td>
                  <td className="text-right text-hanoon-text-dim">{formatPrice(pos.stop_price)}</td>
                  <td className="text-right text-hanoon-text-dim">{formatPrice(pos.target_price)}</td>
                  <td className="text-right text-hanoon-text-dim">{pos.rr.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Exit Health Legend */}
      <div className="mt-2 flex gap-4 text-xs text-hanoon-text-dim">
        <span>STAY = healthy, no exit trigger</span>
        <span>THINK = consider exit</span>
        <span>EXIT = trigger fired</span>
        <span>EXIT_HARD = hard exit (stop hit or hard rule)</span>
      </div>
    </div>
  );
}
