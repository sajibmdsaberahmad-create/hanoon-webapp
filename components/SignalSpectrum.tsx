'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Panel, StatCard } from '@/components/ui';

/**
 * Signal Spectrum — Live JULI signal strength visualization.
 */

interface SignalSpectrumProps {
  data: TelemetrySnapshot | null;
}

export function SignalSpectrum({ data }: SignalSpectrumProps) {
  const [scanIndex, setScanIndex] = useState(0);

  const alpha = data?.brain?.alpha ?? {};
  const signalKeys = Object.keys(alpha);

  useEffect(() => {
    if (signalKeys.length === 0) return;
    const id = setInterval(() => {
      setScanIndex((i) => (i + 1) % signalKeys.length);
    }, 800);
    return () => clearInterval(id);
  }, [signalKeys.length]);

  const signalEngine = data?.signal_engine_enabled ?? false;
  const signalScore = data?.signal_score ?? 0;
  const signalStatus = data?.signal_engine_status ?? '—';

  return (
    <Panel
      title="Signal spectrum"
      badge={
        <span className={`badge ${signalEngine ? 'badge-success' : 'badge-error'}`}>
          <span className={`dot ${signalEngine ? 'dot-success' : 'dot-error'}`} />
          {signalEngine ? 'Engine on' : 'Engine off'}
        </span>
      }
    >
      {/* Engine summary */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard label="Status" value={signalStatus} />
        <StatCard label="Score" value={signalScore.toFixed(4)} />
        <StatCard
          label="Verdict"
          value={data?.brain?.verdict ?? '—'}
          tone={
            data?.brain?.verdict === 'BUY'
              ? 'success'
              : data?.brain?.verdict === 'SELL'
              ? 'error'
              : 'warning'
          }
        />
      </div>

      {/* Signal bars */}
      {signalKeys.length > 0 ? (
        <div className="space-y-1.5">
          {signalKeys.map((key, i) => {
            const val = Number(alpha[key]) || 0;
            const intensity = Math.abs(val);
            const isScanning = i === scanIndex;

            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="w-28 truncate text-hanoon-text-dim">{key}</span>
                <div className="inner-surface h-2 flex-1 overflow-hidden rounded">
                  <div
                    className={`h-full rounded transition-all duration-300 ${
                      val > 0.05
                        ? 'bg-hanoon-success'
                        : val < -0.05
                        ? 'bg-hanoon-error'
                        : 'bg-hanoon-warning'
                    } ${isScanning ? 'animate-pulse-slow' : ''}`}
                    style={{
                      width: `${Math.min(Math.abs(val) * 100, 100)}%`,
                      opacity: val > 0 ? 0.75 + intensity : 0.4,
                    }}
                  />
                </div>
                <span className="tnum w-14 text-right text-hanoon-text-dim">
                  {val > 0 ? '+' : ''}
                  {val.toFixed(3)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="inner-surface px-4 py-6 text-center text-xs text-hanoon-text-dim">
          No active signals.
        </div>
      )}

      {/* Verdict readout */}
      {data?.brain?.verdict && (
        <div className="mt-4 rounded-lg border border-hanoon-border bg-hanoon-surface-2 px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
            <span
              className={
                data.brain.verdict === 'BUY'
                  ? 'font-semibold text-hanoon-success'
                  : data.brain.verdict === 'SELL'
                  ? 'font-semibold text-hanoon-error'
                  : 'font-semibold text-hanoon-warning'
              }
            >
              {data.brain.verdict}
            </span>
            <span className="text-hanoon-text-dim">
              score <span className="tnum text-hanoon-text">{data.brain.score?.toFixed(4)}</span>
            </span>
            <span className="text-hanoon-text-dim">
              conf <span className="tnum text-hanoon-text">{(data.brain.confidence ?? 0).toFixed(3)}</span>
            </span>
            <span className="text-hanoon-text-dim">
              halim <span className="tnum text-hanoon-halim">{data.halim?.advisory ?? '—'}</span>
            </span>
            <span className="text-hanoon-text-dim">
              nash <span className="tnum text-hanoon-nash">{(data.nash?.opinion ?? 0).toFixed(4)}</span>
            </span>
          </div>
        </div>
      )}
    </Panel>
  );
}
