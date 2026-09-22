'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { formatScore, formatPercent } from '@/lib/utils';
import { BrainDebate } from '@/components/BrainDebate';
import { Panel, StatCard, SectionTitle, Skeleton } from '@/components/ui';

/**
 * Brain Panel — L2 Brains: JULI composite score, thinking trace,
 * signal alpha, Nash opinion, and Halim advisory.
 */

interface BrainPanelProps {
  data: TelemetrySnapshot | null;
}

export function BrainPanel({ data }: BrainPanelProps) {
  if (!data) {
    return (
      <Panel title="Decision engine">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-4 h-32 w-full" />
      </Panel>
    );
  }

  const brain = data.brain;
  const nash = data.nash;
  const halim = data.halim;
  const learning = data.learning;
  const weights = data.weights;

  const alpha = brain?.alpha ?? {};
  const alphaEntries = Object.entries(alpha)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 10);

  const gate = data.meta_label_dnn;
  const gateTone =
    gate && typeof gate.healthy === 'boolean'
      ? gate.healthy ? 'success' : 'warning'
      : 'default';

  const verdictTone =
    brain?.verdict === 'BUY'
      ? 'success'
      : brain?.verdict === 'SELL'
      ? 'error'
      : 'warning';

  const nashTone =
    (nash?.opinion ?? 0) > 0
      ? 'success'
      : (nash?.opinion ?? 0) < 0
      ? 'error'
      : 'default';

  const halimTone =
    halim?.advisory === 'approve'
      ? 'success'
      : halim?.advisory === 'reject'
      ? 'error'
      : 'warning';

  return (
    <div className="space-y-4">
      <Panel title="JULI — decision engine">
        {/* Composite score */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Composite score" value={formatScore(brain?.score)} tone="accent" />
          <StatCard
            label="Confidence"
            value={`${((brain?.confidence ?? 0) * 100).toFixed(0)}%`}
            tone="success"
          />
          <StatCard label="Verdict" value={brain?.verdict ?? '—'} tone={verdictTone} />
          <StatCard label="EV" value={`$${(brain?.ev ?? 0).toFixed(4)}`} tone="info" />
          <StatCard
            label="DNN gate"
            value={
              typeof gate?.p_win === 'number'
                ? `${(gate.p_win * 100).toFixed(1)}%`
                : '—'
            }
            tone={gateTone}
          />
        </div>

        {/* Alpha signals */}
        {alphaEntries.length > 0 && (
          <div className="mt-4">
            <SectionTitle>Alpha signals (top 10)</SectionTitle>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {alphaEntries.map(([key, val]) => (
                <div key={key} className="flex items-center justify-between px-1 text-xs">
                  <span className="truncate text-hanoon-text-dim">{key}</span>
                  <span
                    className={`tnum ml-2 font-medium ${
                      val > 0 ? 'text-hanoon-success' : 'text-hanoon-error'
                    }`}
                  >
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thinking trace */}
        {brain?.thinking_trace &&
          typeof brain.thinking_trace === 'object' &&
          Object.keys(brain.thinking_trace).length > 0 && (
            <div className="mt-4">
              <SectionTitle>Thinking trace</SectionTitle>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {Object.entries(brain.thinking_trace)
                  .slice(0, 6)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between px-1 text-xs">
                      <span className="truncate text-hanoon-text-dim">{k}</span>
                      <span className="tnum ml-2 font-medium text-hanoon-text">
                        {typeof v === 'number' ? v.toFixed(4) : String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
      </Panel>

      <Panel title="Nash — statistical gate">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Opinion" value={(nash?.opinion ?? 0).toFixed(4)} tone={nashTone} />
          <StatCard label="Confidence" value={formatScore(nash?.confidence)} />
          <StatCard
            label="Gate authority"
            value={nash?.gate_authority ? 'Yes' : 'No'}
            tone={nash?.gate_authority ? 'success' : 'default'}
          />
          <StatCard
            label="Veto"
            value={nash?.gate_veto ? 'VETO' : 'Clear'}
            tone={nash?.gate_veto ? 'error' : 'success'}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-hanoon-text-dim">
          <span className="tnum">
            Samples: {nash?.n_samples ?? 0} (real: {nash?.n_real_rows ?? 0})
          </span>
          <span>{nash?.trained ? 'Model trained' : 'Model not trained'}</span>
        </div>
      </Panel>

      <Panel title="Halim — supervisor">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Trust" value={(halim?.trust ?? 0).toFixed(2)} tone={halimTone} />
          <StatCard label="Pull" value={(halim?.pull ?? 0).toFixed(4)} />
          <StatCard label="Advisory" value={halim?.advisory ?? '—'} tone={halimTone} />
          <StatCard
            label="Model"
            value={halim?.active ? (halim?.phase ?? 'serve') : 'offline'}
            tone={halim?.active ? 'halim' : 'default'}
          />
        </div>
      </Panel>

      {/* JULI learning + weights */}
      {learning && (
        <Panel title="JULI learning">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Patterns" value={String(learning.patterns ?? learning.patterns_learned ?? 0)} />
            <StatCard
              label="Recent win rate"
              value={formatPercent((learning.win_rate ?? learning.recent_win_rate ?? 0) * 100)}
              tone="success"
            />
            <StatCard
              label="Weight adjustments"
              value={String(learning.total_adjustments ?? learning.weight_adjustments ?? 0)}
            />
            <StatCard label="Decision count" value={String(learning.patterns ?? learning.decision_count ?? 0)} />
          </div>
        </Panel>
      )}

      {/* What JULI thinks about every scanned ticker — the live scan brain */}
      {data.scan_views && Object.keys(data.scan_views).length > 0 && (
        <Panel
          title="What JULI is thinking — scanned tickers"
          badge={
            <span className="badge badge-info">
              <span className="dot dot-info" />
              {Object.keys(data.scan_views).length} live
            </span>
          }
        >
          <div className="max-h-80 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th className="num">Score</th>
                  <th className="num">Direction</th>
                  <th className="num">Conf</th>
                  <th className="num">EV</th>
                  <th className="num">Halim</th>
                  <th className="num">Prediction</th>
                  <th>Key signals</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.scan_views)
                  .sort((a, b) => (b[1]?.score ?? 0) - (a[1]?.score ?? 0))
                  .slice(0, 40)
                  .map(([tk, v]: [string, any]) => (
                    <tr key={tk}>
                      <td className="font-semibold text-hanoon-accent">{tk}</td>
                      <td className={`num ${v.score >= 0.55 ? 'text-hanoon-success' : v.score >= 0.45 ? 'text-hanoon-warning' : 'text-hanoon-text-dim'}`}>
                        {v.score.toFixed(3)}
                      </td>
                      <td className={`num ${v.direction === 1 ? 'text-hanoon-success' : v.direction === -1 ? 'text-hanoon-error' : 'text-hanoon-text-dim'}`}>
                        {v.direction_label ?? 'HOLD'}
                      </td>
                      <td className="num text-hanoon-text-dim">{((v.confidence ?? 0) * 100).toFixed(0)}%</td>
                      <td className={`num ${v.ev > 0 ? 'text-hanoon-success' : v.ev < 0 ? 'text-hanoon-error' : 'text-hanoon-text-dim'}`}>
                        {v.ev.toFixed(4)}
                      </td>
                      <td className={`num ${v.halim_approved ? 'text-hanoon-success' : 'text-hanoon-error'}`}>
                        {v.halim_approved ? '✓' : '✗'}
                      </td>
                      <td className={`num font-semibold ${v.prediction === 'ENTER' ? 'text-hanoon-success' : 'text-hanoon-text-dim'}`}>
                        {v.prediction ?? 'WATCH'}
                      </td>
                      <td className="text-[11px] text-hanoon-text-dim">
                        {v.indicators
                          ? Object.entries(v.indicators)
                              .filter(([, x]) => typeof x === 'number' && Math.abs(x as number) > 0.15)
                              .slice(0, 3)
                              .map(([k, x]) => `${k}=${(x as number).toFixed(2)}`)
                              .join(' · ')
                          : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Distillation + Halim lessons + goal gap */}
      {(data.distill || data.lessons) && (
        <Panel title="Learning — distillation & Halim lessons">
          {data.distill && (
            <div className="mb-3 text-xs text-hanoon-text-dim">
              <span className="tnum">Distill: {data.distill.digest_ts ? 'packaged' : 'pending'}</span>
              <span className="mx-2 text-hanoon-text-faint">·</span>
              <span className="tnum">Gold rows: {data.distill.gold_count ?? (data.distill.count ?? 0)}</span>
              <span className="mx-2 text-hanoon-text-faint">·</span>
              <span className="tnum">Goal gap: {data.lessons?.goal_gap != null ? `$${Number(data.lessons.goal_gap).toLocaleString()}` : '—'}</span>
            </div>
          )}
          {data.lessons?.recent && data.lessons.recent.length > 0 && (
            <div className="space-y-2">
              {data.lessons.recent.slice(0, 5).map((l: any, i: number) => (
                <div key={i} className="rounded-md bg-white/5 p-2 text-xs text-hanoon-text-dim">
                  <span className="font-semibold text-hanoon-accent">{l.ticker}</span>
                  <span className="mx-2 text-hanoon-text-faint">·</span>
                  <span className="tnum">{l.lesson?.slice?.(0, 120) ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {weights?.weights && (
        <Panel title="Weight state">
          <div className="mb-2 text-xs text-hanoon-text-dim">
            <span className="tnum">
              Learned gate: {(weights.learned_gate ?? 0).toFixed(4)}
            </span>
            <span className="mx-2 text-hanoon-text-faint">·</span>
            <span className="tnum">Episodes: {weights.episodic_count ?? 0}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {Object.entries(weights.weights)
              .slice(0, 8)
              .map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="truncate text-hanoon-text-dim">{k}</span>
                  <span className="tnum ml-2 font-medium text-hanoon-text">
                    {formatScore(v as number)}
                  </span>
                </div>
              ))}
          </div>
        </Panel>
      )}

      {/* Brain Debate chat room */}
      <BrainDebate data={data} />
    </div>
  );
}
