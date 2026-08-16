'use client';

import { useState, Fragment } from 'react';
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
  const [expanded, setExpanded] = useState<string | null>(null);

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
                {trades.slice(0, 20).map((t: Trade, i) => {
                  const key = `${t.exec_id ?? i}-${t.ts}`;
                  const pm = t.halim_postmortem;
                  return (
                  <Fragment key={key}>
                  <tr
                    onClick={() => setExpanded(expanded === key ? null : key)}
                    className="cursor-pointer"
                    title="Click for the postmortem — JULI's entry thinking + Halim's review"
                  >
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
                  {expanded === key && (
                    <tr className="bg-black/20">
                      <td colSpan={7} className="p-3">
                        <TradePostmortem t={t} />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                  );
                })}
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

/**
 * Full postmortem of a closed trade: JULI's entry decision (goal, score,
 * confidence, prediction), the outcome, Halim's own postmortem decision on
 * the full data, Halim's lesson, the debate vs JULI, and whether the gold
 * was saved for SFT retraining.
 */
function TradePostmortem({ t }: { t: Trade }) {
  const j = t.juli;
  const he = t.halim_entry;
  const pm = t.halim_postmortem;
  const dirLabel = (d: number | undefined) =>
    d === 1 ? 'LONG' : d === -1 ? 'SHORT' : d === 0 ? 'HOLD' : '—';
  return (
    <div className="space-y-3 text-[12px]">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-hanoon-text-faint">Exit reason</div>
          <div className="tnum font-semibold">{t.exit_reason ?? '—'}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-hanoon-text-faint">Hold</div>
          <div className="tnum">{t.hold_min ? `${t.hold_min.toFixed(0)}m` : '—'}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-hanoon-text-faint">Goal</div>
          <div className="tnum">{t.goal || '—'}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-hanoon-text-faint">SFT gold</div>
          <div className={`tnum font-semibold ${t.gold_saved ? 'text-hanoon-success' : 'text-hanoon-text-faint'}`}>
            {t.gold_saved ? 'SAVED' : '—'}
          </div>
        </div>
      </div>

      {/* JULI's entry decision */}
      <div className="border-t border-hanoon-border-soft pt-2">
        <div className="text-[10px] uppercase tracking-wide text-hanoon-accent">JULI at entry</div>
        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
          <span className="tnum">score <b>{j?.score?.toFixed(3) ?? '—'}</b></span>
          <span className="tnum">dir <b>{dirLabel(j?.direction)}</b></span>
          <span className="tnum">conf <b>{j?.confidence ? `${(j.confidence * 100).toFixed(0)}%` : '—'}</b></span>
          <span className="tnum">verdict <b>{j?.verdict ?? '—'}</b></span>
        </div>
        {j?.trace ? <p className="mt-1 text-hanoon-text-dim">{j.trace}</p> : null}
      </div>

      {/* Halim's parallel call at entry */}
      {he && he.direction !== 0 && (
        <div className="border-t border-hanoon-border-soft pt-2">
          <div className="text-[10px] uppercase tracking-wide text-hanoon-warning">Halim at entry</div>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
            <span className="tnum">dir <b>{dirLabel(he.direction)}</b></span>
            <span className="tnum">conf <b>{he.confidence ? `${(he.confidence * 100).toFixed(0)}%` : '—'}</b></span>
            {he.reason ? <span className="text-hanoon-text-dim">“{he.reason}”</span> : null}
          </div>
        </div>
      )}

      {/* Halim postmortem: own decision + lesson + debate */}
      <div className="border-t border-hanoon-border-soft pt-2">
        <div className="text-[10px] uppercase tracking-wide text-hanoon-warning">Halim postmortem</div>
        {pm?.decision ? (
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
            <span className="tnum">own call <b>{dirLabel(pm.decision.direction)}</b></span>
            <span className="tnum">conf <b>{pm.decision.confidence ? `${(pm.decision.confidence * 100).toFixed(0)}%` : '—'}</b></span>
            {pm.decision.reason ? <span className="text-hanoon-text-dim">“{pm.decision.reason}”</span> : null}
          </div>
        ) : null}
        {pm?.lesson ? (
          <p className="mt-2 rounded-md bg-white/5 p-2 text-hanoon-text">{pm.lesson}</p>
        ) : (
          <p className="mt-1 text-hanoon-text-faint">Halim postmortem pending (runs after close on a background thread).</p>
        )}
        {pm?.debate ? (
          <p className="mt-2 rounded-md bg-hanoon-warning/10 p-2 text-hanoon-text-dim">
            <span className="font-semibold text-hanoon-warning">Debate vs JULI: </span>{pm.debate}
          </p>
        ) : null}
      </div>
    </div>
  );
}
