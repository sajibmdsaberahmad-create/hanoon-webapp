'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { Panel } from '@/components/ui';
import {
  RadioIcon,
  ChartBarIcon,
  CpuChipIcon,
  SparklesIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

/**
 * BrainDebate — the live debate room.
 *
 * Each row is a speaker bubble built from LIVE telemetry (verdicts, traces,
 * confidences, gate stages).
 */

interface BrainDebateProps {
  data: TelemetrySnapshot | null;
}

type Speaker = 'signal' | 'nash' | 'juli' | 'halim' | 'verdict';

const SPEAKER_STYLE: Record<
  Speaker,
  { name: string; icon: React.ComponentType<{ className?: string }>; dot: string; text: string; border: string; bg: string }
> = {
  signal: { name: 'Signal Engine', icon: RadioIcon, dot: 'dot-warning', text: 'text-hanoon-warning', border: 'border-l-hanoon-warning', bg: 'bg-hanoon-warning/5' },
  nash:   { name: 'Nash Cortex', icon: ChartBarIcon, dot: 'dot-info', text: 'text-hanoon-nash', border: 'border-l-hanoon-nash', bg: 'bg-hanoon-nash/5' },
  juli:   { name: 'JULI Brain', icon: CpuChipIcon, dot: 'dot-success', text: 'text-hanoon-accent', border: 'border-l-hanoon-accent', bg: 'bg-hanoon-accent/5' },
  halim:  { name: 'Halim', icon: SparklesIcon, dot: 'dot-halim', text: 'text-hanoon-halim', border: 'border-l-hanoon-halim', bg: 'bg-hanoon-halim/5' },
  verdict:{ name: 'Verdict', icon: ScaleIcon, dot: 'dot-success', text: 'text-hanoon-success', border: 'border-l-hanoon-success', bg: 'bg-hanoon-success/5' },
};

interface DebateRow {
  speaker: Speaker;
  message: string;
  confidence?: number;
  ts: number;
}

export function BrainDebate({ data }: BrainDebateProps) {
  if (!data) {
    return (
      <Panel title="Brain debate">
        <div className="text-xs text-hanoon-text-dim">Waiting for telemetry…</div>
      </Panel>
    );
  }

  // Build debate rows from live telemetry
  const rows: DebateRow[] = [];
  const ts = data.ts;

  // 1. Signal Engine
  if (data.signal_engine_enabled !== undefined) {
    rows.push({
      speaker: 'signal',
      message: `Signal engine ${data.signal_engine_enabled ? 'on' : 'off'} (status: ${data.signal_engine_status ?? 'idle'})`,
      confidence: data.signal_score,
      ts,
    });
  }

  // 2. Nash proposals
  if (data.nash && typeof data.nash === 'object') {
    const nash = data.nash as any;
    rows.push({
      speaker: 'nash',
      message: `Opinion: ${(nash.opinion ?? 0).toFixed(4)} · confidence: ${(nash.confidence ?? 0).toFixed(3)}`,
      confidence: nash.confidence,
      ts,
    });
    if (nash.gate_veto) {
      rows.push({
        speaker: 'nash',
        message: 'Gate veto — confidence below threshold',
        ts,
      });
    }
  }

  // 3. JULI verdict
  if (data.brain) {
    rows.push({
      speaker: 'juli',
      message: `Verdict: ${data.brain.verdict ?? '—'} · score: ${formatScore(data.brain.score)} · confidence: ${(data.brain.confidence ?? 0).toFixed(2)}`,
      confidence: data.brain.confidence,
      ts,
    });
  }

  // 4. Halim advisory
  if (data.halim) {
    rows.push({
      speaker: 'halim',
      message: `Advisory: ${data.halim.advisory ?? '—'} · trust: ${(data.halim.trust ?? 0).toFixed(2)} · pull: ${(data.halim.pull ?? 0).toFixed(4)}`,
      confidence: data.halim.trust,
      ts,
    });
  }

  // 5. Final verdict
  if (data.brain?.verdict) {
    rows.push({
      speaker: 'verdict',
      message: `Final: ${data.brain.verdict} · entry: ${data.signal_halim_approved ? 'approved' : 'pending'}`,
      ts,
    });
  }

  return (
    <Panel title="Brain debate">
      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {rows.length === 0 ? (
          <div className="inner-surface px-4 py-6 text-center text-xs text-hanoon-text-dim">
            No active debate. Waiting for signal pulse…
          </div>
        ) : (
          rows.map((row, i) => {
            const s = SPEAKER_STYLE[row.speaker];
            const confPct =
              row.confidence != null
                ? `${(row.confidence * 100).toFixed(0)}%`
                : null;
            const Icon = s.icon;
            return (
              <div
                key={i}
                className={`flex animate-fade-in-up gap-3 rounded-lg border-l-2 px-3 py-2 ${s.border} ${s.bg}`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="mt-0.5">
                  <span className={`dot ${s.dot}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                    <Icon className={`h-3.5 w-3.5 ${s.text}`} />
                    <span className={s.text}>{s.name}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-hanoon-text">{row.message}</div>
                  {confPct && (
                    <div className="tnum mt-0.5 text-[11px] text-hanoon-text-dim">
                      confidence {confPct}
                    </div>
                  )}
                </div>
                <div className="tnum shrink-0 text-[10px] text-hanoon-text-faint">
                  {new Date(row.ts * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}

function formatScore(val: number | undefined): string {
  if (val == null) return '—';
  return val.toFixed(4);
}
