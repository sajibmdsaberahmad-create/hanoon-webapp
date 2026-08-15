'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { formatPrice, formatPercent, formatCurrency } from '@/lib/utils';

/**
 * Reflection Panel — L4 Reflection: buffer, review, retrain, supervisor.
 *
 * Shows:
 *  - Supervisor state (Halim attached, daily/weekly review timing)
 *  - Buffer trade records (win/loss, P&L, duration)
 *  - Retrain state (when to retrain, session budget)
 *  - Review report (per-ticker, per-indicator breakdowns)
 */

interface ReflectionPanelProps {
  data: TelemetrySnapshot | null;
}

export function ReflectionPanel({ data }: ReflectionPanelProps) {
  if (!data) {
    return <PanelPlaceholder label="REFLECTION" />;
  }

  const supervisor = data.supervisor;
  const review = data.review;

  const formatTimeAgo = (ts: number) => {
    if (!ts) return 'never';
    const now = Date.now();
    const diff = now - ts * 1000;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs font-mono text-hanoon-halim glow-halim mb-2">▶ REFLECTION — Learning Loop</div>

      {/* Supervisor */}
      {supervisor && (
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div>
            <span className="text-hanoon-text-dim">Halim Attached:</span>
            <span className={supervisor.halim_attached ? 'text-hanoon-success' : 'text-hanoon-error'}>
              {supervisor.halim_attached ? 'YES' : 'NO'}
            </span>
          </div>
          <div>
            <span className="text-hanoon-text-dim">Daily Review:</span>
            <span className="text-hanoon-text"> {formatTimeAgo(supervisor.last_daily_review)}</span>
          </div>
          <div>
            <span className="text-hanoon-text-dim">Weekly Review:</span>
            <span className="text-hanoon-text"> {formatTimeAgo(supervisor.last_weekly_review)}</span>
          </div>
          <div>
            <span className="text-hanoon-text-dim">Last Retrain:</span>
            <span className="text-hanoon-text"> {formatTimeAgo(supervisor.last_retrain)}</span>
          </div>
        </div>
      )}

      {/* Retrain State */}
      {supervisor?.retrain && (
        <div className="border-t border-hanoon-border/30 pt-2 mb-2 text-xs">
          <div className="text-xs text-hanoon-text-dim mb-1">Retrain State</div>
          <div className="flex gap-4">
            <span>Retrains: <strong>{supervisor.retrain.retrained_count}</strong></span>
            <span>Max/Sess: <strong>{supervisor.retrain.max_per_session}</strong></span>
          </div>
        </div>
      )}

      {/* Review Report */}
      {review && (
        <div className="border-t border-hanoon-border/30 pt-2">
          <div className="text-xs font-mono text-hanoon-text-dim mb-1">▶ REVIEW REPORT</div>
          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
            <div className="glass-inset rounded-xl p-2 text-center">
              <div className="text-xs text-hanoon-text-dim">Total Trades</div>
              <div className="font-medium text-hanoon-text">{review.summary.total_trades}</div>
            </div>
            <div className="glass-inset rounded-xl p-2 text-center">
              <div className="text-xs text-hanoon-text-dim">Win Rate</div>
              <div className="font-medium text-hanoon-text">{formatPercent(review.summary.win_rate)}</div>
            </div>
            <div className="glass-inset rounded-xl p-2 text-center">
              <div className="text-xs text-hanoon-text-dim">Profit Factor</div>
              <div className="font-medium text-hanoon-text">{review.summary.profit_factor.toFixed(2)}</div>
            </div>
          </div>

          {/* Action Items */}
          {review.action_items && review.action_items.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-hanoon-text-dim mb-1">Action Items</div>
              <ul className="list-none space-y-0.5">
                {review.action_items.slice(0, 5).map((item, i) => (
                  <li key={i} className="text-xs text-hanoon-text-dim">• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Per-ticker breakdown */}
          {review.per_ticker && Object.keys(review.per_ticker).length > 0 && (
            <div className="mt-2 overflow-x-auto max-h-32">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-hanoon-border">
                    <th className="text-left py-0.5 text-hanoon-text-dim">Ticker</th>
                    <th className="text-right py-0.5 text-hanoon-text-dim">Trades</th>
                    <th className="text-right py-0.5 text-hanoon-text-dim">WinRate</th>
                    <th className="text-right py-0.5 text-hanoon-text-dim">PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(review.per_ticker).map(([ticker, stats]) => (
                    <tr key={ticker} className="border-b border-hanoon-border/20">
                      <td className="py-0.5 text-hanoon-accent">{ticker}</td>
                      <td className="text-right text-hanoon-text-dim">{stats.count}</td>
                      <td className="text-right text-hanoon-success">{formatPercent(stats.wr)}</td>
                      <td className={`text-right ${stats.pnl >= 0 ? 'text-hanoon-success' : 'text-hanoon-error'}`}>
                        {formatCurrency(stats.pnl)}
                  </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PanelPlaceholder({ label }: { label: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs font-mono text-hanoon-text-dim mb-2">▶ {label}</div>
      <div className="text-xs text-hanoon-text-dim">Loading reflection state…</div>
    </div>
  );
}
