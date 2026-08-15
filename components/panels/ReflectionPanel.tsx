'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { formatPercent, formatCurrency } from '@/lib/utils';
import { Panel, StatCard, SectionTitle, Skeleton, EmptyState } from '@/components/ui';

/**
 * Reflection Panel — L4 Reflection: supervisor, retrain, review report.
 */

interface ReflectionPanelProps {
  data: TelemetrySnapshot | null;
}

export function ReflectionPanel({ data }: ReflectionPanelProps) {
  if (!data) {
    return (
      <Panel title="Reflection">
        <Skeleton className="h-32 w-full" />
      </Panel>
    );
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
    <div className="space-y-4">
      {/* Supervisor */}
      <Panel title="Supervisor">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Halim attached"
            value={supervisor?.halim_attached ? 'Yes' : 'No'}
            tone={supervisor?.halim_attached ? 'success' : 'default'}
          />
          <StatCard label="Daily review" value={formatTimeAgo(supervisor?.last_daily_review ?? 0)} />
          <StatCard label="Weekly review" value={formatTimeAgo(supervisor?.last_weekly_review ?? 0)} />
          <StatCard label="Last retrain" value={formatTimeAgo(supervisor?.last_retrain ?? 0)} />
        </div>
        {supervisor?.retrain && (
          <div className="mt-3 text-xs text-hanoon-text-dim">
            <span className="tnum">Retrains this session: {supervisor.retrain.retrained_count}</span>
            <span className="mx-2 text-hanoon-text-faint">·</span>
            <span className="tnum">Max per session: {supervisor.retrain.max_per_session}</span>
          </div>
        )}
      </Panel>

      {/* Review report */}
      {review ? (
        <Panel title="Review report">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Total trades" value={String(review.summary.total_trades)} />
            <StatCard label="Win rate" value={formatPercent(review.summary.win_rate)} tone="success" />
            <StatCard label="Profit factor" value={review.summary.profit_factor.toFixed(2)} />
            <StatCard
              label="Total P&L"
              value={formatCurrency(review.summary.total_pnl)}
              tone={review.summary.total_pnl >= 0 ? 'success' : 'error'}
            />
          </div>

          {/* Action items */}
          {review.action_items && review.action_items.length > 0 && (
            <div className="mt-4">
              <SectionTitle>Action items</SectionTitle>
              <ul className="space-y-1">
                {review.action_items.slice(0, 5).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-hanoon-text-dim">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-hanoon-warning" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Per-ticker breakdown */}
          {review.per_ticker && Object.keys(review.per_ticker).length > 0 && (
            <div className="mt-4">
              <SectionTitle>Per-ticker</SectionTitle>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th className="num">Trades</th>
                      <th className="num">Win rate</th>
                      <th className="num">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(review.per_ticker).map(([ticker, stats]) => (
                      <tr key={ticker}>
                        <td className="font-semibold text-hanoon-accent">{ticker}</td>
                        <td className="num">{stats.count}</td>
                        <td className={`num ${stats.wr >= 50 ? 'text-hanoon-success' : 'text-hanoon-warning'}`}>
                          {formatPercent(stats.wr)}
                        </td>
                        <td className={`num ${stats.pnl >= 0 ? 'text-hanoon-success' : 'text-hanoon-error'}`}>
                          {formatCurrency(stats.pnl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Panel>
      ) : (
        <Panel title="Review report">
          <EmptyState title="No review yet" description="A review report is generated after the trading session." />
        </Panel>
      )}
    </div>
  );
}
