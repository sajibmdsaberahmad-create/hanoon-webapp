'use client';

import type { TelemetrySnapshot } from '@/lib/types';
import { useEffect, useState } from 'react';

/**
 * Signal Spectrum — Live JULI signal strength visualization.
 *
 * Renders each of JULI's alpha signals as a breathing bar:
 *  green (bullish) → amber (neutral) → red (bearish).
 * Shows the signal engine status and a live decision ticker.
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
    <div className="bg-hanoon-panel border border-hanoon-border rounded p-3 mb-4">
      <div className="text-xs font-mono text-hanoon-text-dim mb-2">▶ SIGNAL SPECTRUM</div>

      {/* Signal engine status */}
      <div className="flex items-center gap-3 mb-3 text-xs">
        <span className="text-hanoon-text-dim">Engine:</span>
        <span className={signalEngine ? 'text-hanoon-success' : 'text-hanoon-error'}>
          {signalEngine ? 'ON' : 'OFF'}
        </span>
        <span className="text-hanoon-text-dim">Status: {signalStatus}</span>
        <span className="text-hanoon-text-dim">Score: {signalScore.toFixed(4)}</span>
      </div>

      {/* Signal bars */}
      {signalKeys.length > 0 ? (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {signalKeys.map((key, i) => {
            const val = Number(alpha[key]) || 0;
            const intensity = Math.abs(val);
            const isScanning = i === scanIndex;
            const barColor = val > 0.05 ? 'bg-hanoon-success' :
              val < -0.05 ? 'bg-hanoon-error' : 'bg-hanoon-warning';

            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className={`w-24 text-hanoon-text-dim truncate`}>{key}</span>
                <div className="flex-1 h-3 bg-hanoon-bg rounded overflow-hidden">
                  <div
                    className={`h-full ${barColor} transition-all duration-300 ${isScanning ? 'animate-pulse-slow' : ''}`}
                    style={{ width: `${Math.min(intensity * 100, 100)}%`, opacity: val > 0 ? 0.8 + intensity : 0.4 }}
                  />
                </div>
                <span className="w-12 text-right text-hanoon-text-dim">{val.toFixed(3)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-hanoon-text-dim">No signals active.</div>
      )}

      {/* Decision ticker */}
      {data?.brain?.verdict && (
        <div className="mt-3 text-xs font-mono bg-hanoon-bg rounded p-1.5 border border-hanoon-border">
          <span className="text-hanoon-text-dim">VERDICT:</span>
          <span className={
            data.brain.verdict === 'BUY' ? 'text-hanoon-success' :
            data.brain.verdict === 'SELL' ? 'text-hanoon-error' :
            'text-hanoon-warning'
          }> {data.brain.verdict}</span>
          <span className="text-hanoon-text-dim"> score={data.brain.score?.toFixed(4)}</span>
          <span className="text-hanoon-text-dim"> conf={data.brain.confidence?.toFixed(3)}</span>
          <span className="text-hanoon-text-dim"> halim={data.halim?.advisory ?? '—'}</span>
          <span className="text-hanoon-text-dim"> nash={data.nash?.opinion?.toFixed(4) ?? '—'}</span>
        </div>
      )}
    </div>
  );
}
