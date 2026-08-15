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
            <StatCard label="Patterns" value={String(learning.patterns_learned ?? 0)} />
            <StatCard
              label="Recent win rate"
              value={formatPercent(learning.recent_win_rate)}
              tone="success"
            />
            <StatCard
              label="Weight adjustments"
              value={String(learning.weight_adjustments ?? 0)}
            />
            <StatCard label="Decision count" value={String(learning.decision_count ?? 0)} />
          </div>
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
