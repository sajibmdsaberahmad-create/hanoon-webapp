'use client';

import type { TelemetrySnapshot } from '@/lib/types';

/**
 * BrainDebate — the live debate room.
 *
 * Shows the HANOON brain components ARGUING in real time, chat-style:
 *   📡 Signal Engine fires  →  🧠 Nash proposes  →  💭 JULI argues
 *   →  🔭 Halim vetoes/approves  →  ⚖️ VERDICT
 *
 * Each row is a speaker bubble built from LIVE telemetry (verdicts, traces,
 * confidences, gate stages).
 */

interface BrainDebateProps {
  data: TelemetrySnapshot | null;
}

type Speaker = 'signal' | 'nash' | 'juli' | 'halim' | 'verdict';

const SPEAKER_STYLE: Record<Speaker, { name: string; icon: string; dot: string }> = {
  signal: { name: 'SIGNAL ENGINE',  icon: '📡', dot: 'bg-amber-400' },
  nash:   { name: 'NASH CORTEX',     icon: '🧠', dot: 'bg-blue-400' },
  juli:   { name: 'JULI BRAIN',      icon: '💭', dot: 'bg-cyan-400' },
  halim:  { name: 'HALIM',           icon: '🔭', dot: 'bg-violet-400' },
  verdict:{ name: 'VERDICT',         icon: '⚖️', dot: 'bg-emerald-400' },
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
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="text-xs font-mono text-hanoon-text-dim mb-2">▶ BRAIN DEBATE</div>
        <div className="text-xs text-hanoon-text-dim">Loading debate state…</div>
      </div>
    );
  }

  // Build debate rows from live telemetry
  const rows: DebateRow[] = [];
  const ts = data.ts;

  // 1. Signal Engine
  if (data.signal_engine_enabled !== undefined) {
    rows.push({
      speaker: 'signal',
      message: `Signal engine ${data.signal_engine_enabled ? 'ON' : 'OFF'} (status: ${data.signal_engine_status ?? 'idle'})`,
      confidence: data.signal_score,
      ts,
    });
  }

  // 2. Nash proposals
  if (data.nash && typeof data.nash === 'object') {
    const nash = data.nash as any;
    rows.push({
      speaker: 'nash',
      message: `Opinion: ${(nash.opinion ?? 0).toFixed(4)} (confidence: ${(nash.confidence ?? 0).toFixed(3)})`,
      confidence: nash.confidence,
      ts,
    });
    if (nash.gate_veto) {
      rows.push({
        speaker: 'nash',
        message: '⚠️ GATE VETO — confidence below threshold',
        ts,
      });
    }
  }

  // 3. JULI verdict
  if (data.brain) {
    rows.push({
      speaker: 'juli',
      message: `Verdict: ${data.brain.verdict ?? '—'} | score: ${formatScore(data.brain.score)} | confidence: ${(data.brain.confidence ?? 0).toFixed(2)}`,
      confidence: data.brain.confidence,
      ts,
    });
  }

  // 4. Halim advisory
  if (data.halim) {
    rows.push({
      speaker: 'halim',
      message: `Advisory: ${data.halim.advisory ?? '—'} | trust: ${(data.halim.trust ?? 0).toFixed(2)} | pull: ${(data.halim.pull ?? 0).toFixed(4)}`,
      confidence: data.halim.trust,
      ts,
    });
  }

  // 5. Final verdict
  if (data.brain?.verdict) {
    rows.push({
      speaker: 'verdict',
      message: `FINAL: ${data.brain.verdict} | entry: ${data.signal_halim_approved ? 'approved' : 'pending'}`,
      ts,
    });
  }

  return (
    <div className="glass rounded-2xl p-4 mb-4">
      <div className="text-xs font-mono text-hanoon-halim glow-halim mb-2">▶ BRAIN DEBATE</div>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="text-xs text-hanoon-text-dim">
            ⚙️ No active debate. Waiting for signal pulse…
          </div>
        ) : (
          rows.map((row, i) => {
            const s = SPEAKER_STYLE[row.speaker];
            const confPct = row.confidence != null
              ? ` ${(row.confidence * 100).toFixed(0)}%`
              : '';
            return (
              <div
                key={i}
                className={`flex gap-2 items-start text-xs p-1.5 rounded border-l-2
                  ${row.speaker === 'verdict'
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : row.speaker === 'halim'
                    ? 'border-violet-500 bg-violet-500/5'
                    : row.speaker === 'nash'
                    ? 'border-blue-500 bg-blue-500/5'
                    : row.speaker === 'juli'
                    ? 'border-cyan-500 bg-cyan-500/5'
                    : 'border-amber-500 bg-amber-500/5'
                  }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${s.dot} animate-pulse-slow`} />
                </div>
                <div className="flex-1">
                  <div className="font-mono text-hanoon-text-dim">
                    {s.icon} <strong>{s.name}</strong>
                  </div>
                  <div className="text-hanoon-text mt-0.5">{row.message}</div>
                  {confPct && (
                    <div className="text-hanoon-text-dim mt-0.5">conf{confPct}</div>
                  )}
                </div>
                <div className="text-hanoon-text-dim text-[10px]">
                  {new Date(row.ts * 1000).toLocaleTimeString()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatScore(val: number | undefined): string {
  if (val == null) return '—';
  return val.toFixed(4);
}
