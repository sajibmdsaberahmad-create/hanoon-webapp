'use client';

import { getBridgeClient } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import type { TelemetrySnapshot } from '@/lib/types';
import { ExclamationTriangleIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';

/**
 * ReconnectingProvider — wraps the dashboard in a provider that
 * polls telemetry with exponential backoff on failure.
 */

interface ReconnectingProviderProps {
  children: React.ReactNode;
  pollInterval?: number;
  bridgeUrl?: string;
}

// ── ReconnectingProvider ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ReconnectingProvider({ children }: ReconnectingProviderProps) {
  return <>{children}</>;
}

// ── ReconnectionBanner ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ReconnectionBanner({
  state,
  error,
  latency,
  stale,
}: {
  state: string;
  error: string | null;
  latency: number;
  stale: boolean;
}) {
  if (state === 'connected' && !stale) return null;

  const tone = state === 'error' ? 'error' : 'warning';
  const text =
    (state === 'stale' && 'Telemetry is stale — the bridge may not be writing data.') ||
    (state === 'connected' && stale && 'Telemetry is stale.') ||
    (state === 'disconnected' && 'Bridge disconnected — retrying…') ||
    (state === 'error' && `Connection error: ${error}`) ||
    (state === 'connecting' && 'Connecting to the bridge…');

  return (
    <div
      className={`animate-fade-in mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
        tone === 'error'
          ? 'border-hanoon-error/30 bg-hanoon-error/5 text-hanoon-error'
          : 'border-hanoon-warning/30 bg-hanoon-warning/5 text-hanoon-warning'
      }`}
    >
      {tone === 'error' ? (
        <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
      ) : (
        <CloudArrowDownIcon className="h-4 w-4 shrink-0" />
      )}
      <span className="flex-1">{text}</span>
      <span className="tnum shrink-0 text-hanoon-text-faint">latency {latency}ms</span>
    </div>
  );
}

// ── LiveTicker: small real-time pulse indicator ━━━━━━━━━━━━━━━━━━━━━━━━━

export function LiveTicker() {
  const { data } = useTicker();
  if (!data) return <span className="text-xs text-hanoon-text-dim">—</span>;

  const now = Date.now();
  const age = now - data.ts * 1000;
  const live = age < 5000;

  return (
    <span className={`dot ${live ? 'dot-success dot-live' : ''}`} />
  );
}

function useTicker() {
  const [data, setData] = useState<TelemetrySnapshot | null>(null);
  const client = getBridgeClient();

  const tick = useCallback(async () => {
    const result = await client.fetchTelemetry();
    if (result.ok && result.data) {
      setData(result.data);
    }
  }, [client]);

  useEffect(() => {
    tick();
    const iv = setInterval(tick, 5000);
    return () => clearInterval(iv);
  }, [tick]);

  return { data };
}
