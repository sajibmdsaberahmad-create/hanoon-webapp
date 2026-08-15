'use client';

import type { TelemetrySnapshot, Trade } from '@/lib/types';
import { formatPrice, formatCurrency } from '@/lib/utils';
import { Panel, StatCard, EmptyState, Skeleton } from '@/components/ui';

/**
 * Trades Panel — L3 Execution: live trades, brackets, buffer stats.
 */

interface TradesPanelProps {
  data: TelemetrySnapshot | null;
}

export function TradesPanel({ data }: TradesPanelProps) {
  if (!data) {
    return (
      <Panel title="Trades">
        <Skeleton className="h-32 w-full" />
      </Panel>
    );
  }

  const trades = data.trades ?? [];
  const buffer = data.buffer;
  const brackets = data.brackets ?? [];

  return (
    <div className="space-y-4">
      {/* Buffer stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total trades" value={String(buffer?.trade_count ?? 0)} />
        <StatCard
          label="Win rate"
          value={`${((buffer?.win_rate ?? 0) * 100).toFixed(1)}%`}
          tone="success"
        />
        <StatCard
          label="Total P&L"
          value={formatCurrency(buffer?.total_pnl ?? 0)}
          tone={(buffer?.total_pnl ?? 0) >= 0 ? 'success' : 'error'}
        />
        <StatCard label="Open positions" value={String(buffer?.open_positions ?? 0)} tone="info" />
      </div>

      {/* Recent live trades */}
      <Panel
        title="Recent trades"
        badge={
          <span className="badge badge-info">
            <span className="dot dot-info" />
            last {Math.min(trades.length, 20)}
          </span>
        }
      >
        {trades.length === 0 ? (
          <EmptyState title="No trades yet" description="Fills from IB will show up here in real time." />
        ) : (
          <div className="max-h-72 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Ticker</th>
                  <th className="num">Side</th>
                  <th className="num">Qty</th>
                  <th className="num">Price</th>
                  <th className="num">P&L</th>
                  <th className="num">Comm</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 20).map((t: Trade, i) => (
                  <tr key={`${t.exec_id ?? i}-${t.ts}`}>
                    <td className="text-hanoon-text-dim">
                      {new Date(t.ts * 1000).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="font-semibold text-hanoon-accent">{t.ticker}</td>
                    <td className={`num font-medium ${t.side === 'BUY' ? 'text-hanoon-success' : 'text-hanoon-error'}`}>
                      {t.side}
                    </td>
                    <td className="num">{t.qty.toFixed(2)}</td>
                    <td className="num text-hanoon-text-dim">{formatPrice(t.price)}</td>
                    <td className={`num ${t.realized_pnl >= 0 ? 'text-hanoon-success' : 'text-hanoon-error'}`}>
                      {formatCurrency(t.realized_pnl)}
                    </td>
                    <td className="num text-hanoon-text-dim">{t.commission.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Active brackets */}
      {brackets.length > 0 && (
        <Panel
          title="Active brackets"
          badge={
            <span className="badge badge-warning">
              <span className="dot dot-warning" />
              {brackets.length}
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th className="num">Entry</th>
                  <th className="num">Stop</th>
                  <th className="num">Target</th>
                  <th className="num">RR</th>
                  <th className="num">Status</th>
                </tr>
              </thead>
              <tbody>
                {brackets.map((b: any) => (
                  <tr key={b.ticker}>
                    <td className="font-semibold text-hanoon-accent">{b.ticker}</td>
                    <td className="num text-hanoon-text-dim">{formatPrice(b.entry_price)}</td>
                    <td className="num text-hanoon-error">{formatPrice(b.stop_price)}</td>
                    <td className="num text-hanoon-success">{formatPrice(b.target_price)}</td>
                    <td className="num text-hanoon-text-dim">{b.rr_ratio?.toFixed(1)}</td>
                    <td className="num">
                      <span className={`badge ${b.active ? 'badge-success' : 'badge'}`}>
                        <span className={`dot ${b.active ? 'dot-success' : ''}`} />
                        {b.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
