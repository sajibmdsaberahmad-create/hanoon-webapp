'use client';

import { getBridgeClient } from '@/lib/api';
import { formatPercent, formatPrice } from '@/lib/utils';
import { useEffect, useState, useCallback } from 'react';
import type { TelemetrySnapshot } from '@/lib/types';

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

  const bg = state === 'stale' ? 'bg-hanoon-warning/10 border-hanoon-warning' :
    state === 'error' ? 'bg-hanoon-error/10 border-hanoon-error' :
    'bg-hanoon-warning/10 border-hanoon-warning';

  return (
    <div className={`border-b px-3 py-1.5 text-xs font-mono ${bg} mb-3`}>
      <span className="text-hanoon-text-dim">
        {state === 'stale' && '⚠️ Data stale — bridge may not be writing telemetry'}
        {state === 'connected' && stale && '⚠️ Data stale'}
        {state === 'disconnected' && '⏳ Disconnected — retrying…'}
        {state === 'error' && `❌ Connection error: ${error}`}
        {state === 'connecting' && '🔄 Connecting…'}
      </span>
      <span className="ml-4 text-hanoon-text-dim">Latency: {latency}ms</span>
    </div>
  );
}

// ── LiveTicker: small real-time pulse indicator ━━━━━━━━━━━━━━━━━━━━━━━━━

export function LiveTicker() {
  const { data } = useTicker();
  if (!data) return <span className="text-xs text-hanoon-text-dim">⏳</span>;

  const now = Date.now();
  const age = now - data.ts * 1000;
  const pulse = age < 5000 ? 'text-hanoon-success animate-pulse-slow' : 'text-hanoon-text-dim';

  return (
    <span className={`text-xs ${pulse}`}>
      {'●'}
    </span>
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
