'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { formatScore, formatPercent } from '@/lib/utils';
import { BrainDebate } from '@/components/BrainDebate';

/**
 * Brain Panel — L2 Brains: JULI composite score, thinking trace,
 * signal alpha, Nash opinion, and Halim advisory.
 *
 * This is the core decision-making visualization. It shows:
 *  - JULI's alpha signal breakdown (top 10 by magnitude)
 *  - JULI cognitive thinking trace (5 pillars)
 *  - Nash model opinion (bounded ±0.03)
 *  - Halim trust + advisory (approve/reject/hold)
 *  - Composite brain score
 *  - BrainDebate chat room (live argument between signal → nash → juli → halim → verdict)
 */

interface BrainPanelProps {
  data: TelemetrySnapshot | null;
}

export function BrainPanel({ data }: BrainPanelProps) {
  if (!data) {
    return <PanelPlaceholder label="BRAIN — Decision Engine" />;
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

  const verdictColor =
    brain?.verdict === 'BUY'
      ? 'text-hanoon-success'
      : brain?.verdict === 'SELL'
      ? 'text-hanoon-error'
      : 'text-hanoon-warning';

  const nashColor =
    (nash?.opinion ?? 0) > 0
      ? 'text-hanoon-success'
      : (nash?.opinion ?? 0) < 0
      ? 'text-hanoon-error'
      : 'text-hanoon-text-dim';

  const halimColor =
    halim?.advisory === 'approve'
      ? 'text-hanoon-success'
      : halim?.advisory === 'reject'
      ? 'text-hanoon-error'
      : 'text-hanoon-warning';

  return (
    <>
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="text-xs font-mono text-hanoon-juli glow-juli mb-2">
          ▶ BRAIN — Decision Engine
        </div>

        {/* Composite Score */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <Stat
            label="Composite Score"
            value={formatScore(brain?.score)}
            color="text-hanoon-juli"
          />
          <Stat
            label="Confidence"
            value={`${((brain?.confidence ?? 0) * 100).toFixed(0)}%`}
            color="text-hanoon-success"
          />
          <Stat label="Verdict" value={brain?.verdict ?? '—'} color={verdictColor} />
          <Stat
            label="EV"
            value={`$${(brain?.ev ?? 0).toFixed(4)}`}
            color="text-hanoon-nash"
          />
        </div>

        {/* JULI Alpha Signals (top 10 by magnitude) */}
        {alphaEntries.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-hanoon-text-dim mb-1">
              JULI Alpha Signals (top 10)
            </div>
            <div className="grid grid-cols-2 gap-1">
              {alphaEntries.map(([key, val]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-hanoon-text-dim">{key}</span>
                  <span
                    className={
                      val > 0 ? 'text-hanoon-success' : 'text-hanoon-error'
                    }
                  >
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nash Opinion */}
        <div className="border-t border-hanoon-border/30 pt-2 mb-2">
          <div className="text-xs font-mono text-hanoon-nash mb-1">
            ▶ NASH OPINION
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <Stat
              label="Opinion"
              value={`${(nash?.opinion ?? 0).toFixed(4)}`}
              color={nashColor}
            />
            <Stat label="Confidence" value={formatScore(nash?.confidence)} />
            <Stat
              label="Gate Authority"
              value={nash?.gate_authority ? 'YES' : 'NO'}
              color={
                nash?.gate_authority
                  ? 'text-hanoon-success'
                  : 'text-hanoon-text-dim'
              }
            />
            <Stat
              label="Veto"
              value={nash?.gate_veto ? '🔒 VETO' : '✓'}
              color={
                nash?.gate_veto ? 'text-hanoon-error' : 'text-hanoon-success'
              }
            />
          </div>
        </div>

        {/* Halim Advisory */}
        <div className="border-t border-hanoon-border/30 pt-2 mb-2">
          <div className="text-xs font-mono text-hanoon-halim mb-1">
            ▶ HALIM ADVISORY
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <Stat
              label="Trust"
              value={(halim?.trust ?? 0).toFixed(2)}
              color={halimColor}
            />
            <Stat label="Pull" value={`${(halim?.pull ?? 0).toFixed(4)}`} />
            <Stat label="Advice" value={halim?.advisory ?? '—'} color={halimColor} />
            <Stat
              label="Active"
              value={halim?.active ? '●' : '○'}
              color={halim?.active ? 'text-hanoon-halim' : 'text-hanoon-error'}
            />
          </div>
        </div>

        {/* JULI Learning */}
        {learning && (
          <div className="border-t border-hanoon-border/30 pt-2">
            <div className="text-xs font-mono text-hanoon-text-dim mb-1">
              ▶ JULI LEARNING
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Stat label="Patterns" value={String(learning.patterns_learned ?? 0)} />
              <Stat label="Win Rate" value={formatPercent(learning.recent_win_rate)} />
              <Stat
                label="Weight Adjustments"
                value={String(learning.weight_adjustments ?? 0)}
              />
            </div>
          </div>
        )}

        {/* Weight state (if available) */}
        {weights?.weights && (
          <div className="border-t border-hanoon-border/30 pt-2 mt-2">
            <div className="text-xs font-mono text-hanoon-text-dim mb-1">
              ▶ WEIGHT STATE
            </div>
            <div className="text-xs text-hanoon-text-dim">
              Learned Gate: {(weights.learned_gate ?? 0).toFixed(4)}
              · Episodes: {weights.episodic_count ?? 0}
            </div>
            <div className="mt-1 text-xs text-hanoon-text-dim max-h-16 overflow-y-auto">
              {Object.entries(weights.weights)
                .slice(0, 8)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span>{formatScore(v as number)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Brain Debate chat room */}
      <BrainDebate data={data} />
    </>
  );
}

function PanelPlaceholder({ label }: { label: string }) {
  return (
    <div className="glass rounded-2xl p-4 mb-4">
      <div className="text-xs font-mono text-hanoon-text-dim mb-2">
        ▶ {label}
      </div>
      <div className="text-xs text-hanoon-text-dim">Loading brain state…</div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="glass-inset rounded-xl p-2 text-center">
      <div className="text-[10px] text-hanoon-text-dim uppercase tracking-wider">{label}</div>
      <div
        className={`text-sm font-medium mt-0.5 ${color || 'text-hanoon-text'}`}
      >
        {value}
      </div>
    </div>
  );
}
