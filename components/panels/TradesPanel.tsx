'use client';

import type { TelemetrySnapshot, Trade, TradeRecord } from '@/lib/types';
import { formatPrice, formatCurrency } from '@/lib/utils';

/**
 * Trades Panel — L4 Reflection: trade buffer, live trades, and
 * realized P&L from reflection buffer.
 *
 * Shows:
 *  - Recent live trades (from IB fills)
 *  - Buffer stats (win rate, total P&L, count)
 *  - Per-ticker trade history
 */

interface TradesPanelProps {
  data: TelemetrySnapshot | null;
}

export function TradesPanel({ data }: TradesPanelProps) {
  if (!data) {
    return (
      <div className="bg-hanoon-panel border border-hanoon-border rounded p-3 mb-4">
        <div className="text-xs font-mono text-hanoon-text-dim mb-2">▶ TRADES</div>
        <div className="text-xs text-hanoon-text-dim">Loading trades…</div>
      </div>
    );
  }

  const trades = data.trades ?? [];
  const buffer = data.buffer;
  const brackets = data.brackets ?? [];

  const bufferStats = [
    { label: 'Total Trades', value: String(buffer?.trade_count ?? 0) },
    { label: 'Win Rate', value: `${((buffer?.win_rate ?? 0) * 100).toFixed(1)}%` },
    { label: 'Total P&L', value: formatCurrency(buffer?.total_pnl ?? 0) },
    { label: 'Open Positions', value: String(buffer?.open_positions ?? 0) },
  ];

  return (
    <div className="bg-hanoon-panel border border-hanoon-border rounded p-3 mb-4">
      <div className="text-xs font-mono text-hanoon-accent mb-2">▶ TRADES — Execution Log</div>

      {/* Buffer stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {bufferStats.map((s) => (
          <div key={s.label} className="bg-hanoon-bg rounded p-2 border border-hanoon-border text-center">
            <div className="text-xs text-hanoon-text-dim">{s.label}</div>
            <div className="text-sm font-medium text-hanoon-text">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent live trades (last 20) */}
      {trades.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-hanoon-text-dim mb-1">Recent Trades (last {Math.min(trades.length, 20)})</div>
          <div className="overflow-x-auto max-h-48">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-hanoon-border">
                  <th className="text-left py-0.5 text-hanoon-text-dim">Time</th>
                  <th className="text-left py-0.5 text-hanoon-text-dim">Ticker</th>
                  <th className="text-right py-0.5 text-hanoon-text-dim">Side</th>
                  <th className="text-right py-0.5 text-hanoon-text-dim">Qty</th>
                  <th className="text-right py-0.5 text-hanoon-text-dim">Price</th>
                  <th className="text-right py-0.5 text-hanoon-text-dim">PnL</th>
                  <th className="text-right py-0.5 text-hanoon-text-dim">Comm</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 20).map((t: Trade, i) => (
                  <tr key={`${t.exec_id ?? i}-${t.ts}`} className="border-b border-hanoon-border/30 hover:bg-hanoon-bg/30">
                    <td className="py-0.5 text-hanoon-text-dim">{new Date(t.ts * 1000).toLocaleTimeString()}</td>
                    <td className="py-0.5 text-hanoon-accent">{t.ticker}</td>
                    <td className={`text-right ${t.side === 'BUY' ? 'text-hanoon-success' : 'text-hanoon-error'}`}>{t.side}</td>
                    <td className="text-right">{t.qty.toFixed(2)}</td>
                    <td className="text-right text-hanoon-text-dim">{formatPrice(t.price)}</td>
                    <td className={`text-right ${t.realized_pnl >= 0 ? 'text-hanoon-success' : 'text-hanoon-error'}`}>
                      {formatCurrency(t.realized_pnl)}
                    </td>
                    <td className="text-right text-hanoon-text-dim">{t.commission.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active brackets */}
      {brackets.length > 0 && (
        <div>
          <div className="text-xs text-hanoon-text-dim mb-1">Active Brackets</div>
          <div className="overflow-x-auto max-h-32">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-hanoon-border">
                  <th className="text-left py-0.5 text-hanoon-text-dim">Ticker</th>
                  <th className="text-right py-0.5 text-hanoon-text-dim">Entry</th>
                  <th className="text-right py-0.5 text-hanoon-text-dim">Stop</th>
                  <th className="text-right py-0.5 text-hanoon-text-dim">Target</th>
                  <th className="text-right py-0.5 text-hanoon-text-dim">RR</th>
                  <th className="text-right py-0.5 text-hanoon-text-dim">Active</th>
                </tr>
              </thead>
              <tbody>
                {brackets.map((b: any) => (
                  <tr key={b.ticker} className="border-b border-hanoon-border/20">
                    <td className="py-0.5 text-hanoon-accent">{b.ticker}</td>
                    <td className="text-right text-hanoon-text-dim">{formatPrice(b.entry_price)}</td>
                    <td className="text-right text-hanoon-error">{formatPrice(b.stop_price)}</td>
                    <td className="text-right text-hanoon-success">{formatPrice(b.target_price)}</td>
                    <td className="text-right text-hanoon-text-dim">{b.rr_ratio.toFixed(1)}</td>
                    <td className="text-right">{b.active ? '●' : '○'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {trades.length === 0 && brackets.length === 0 && (
        <div className="text-xs text-hanoon-text-dim">No trades or brackets recorded yet.</div>
      )}
    </div>
  );
}
