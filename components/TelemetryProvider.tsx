'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { getBridgeClient, BridgeClient } from '@/lib/api';
import type { TelemetrySnapshot, HealthResponse } from '@/lib/types';

export interface TelemetryContextValue {
  data: TelemetrySnapshot | null;
  health: HealthResponse | null;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'stale' | 'error';
  latencyMs: number;
  stale: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  client: BridgeClient;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export const useTelemetry = () => {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error('useTelemetry must be used within TelemetryProvider');
  return ctx;
};

interface TelemetryProviderProps {
  children: React.ReactNode;
  pollInterval?: number;
}

export function TelemetryProvider({ children, pollInterval = 5000 }: TelemetryProviderProps) {
  const [data, setData] = useState<TelemetrySnapshot | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [connectionState, setConnectionState] =
    useState<'disconnected' | 'connecting' | 'connected' | 'stale' | 'error'>('disconnected');
  const [latencyMs, setLatencyMs] = useState(0);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<BridgeClient | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  if (!clientRef.current) {
    clientRef.current = getBridgeClient();
  }
  const client = clientRef.current;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const result = await client.fetchAll();

    setConnectionState(result.telemetry.connectionState);
    setLatencyMs(result.telemetry.latencyMs);
    setStale(result.telemetry.stale);

    if (result.telemetry.ok && result.telemetry.data) {
      setData(result.telemetry.data);
      setError(null);
    } else {
      setError(result.telemetry.error);
    }

    if (result.health.ok && result.health.data) {
      setHealth(result.health.data);
    }

    setLoading(false);
  }, [client]);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, pollInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll, pollInterval]);

  return (
    <TelemetryContext.Provider
      value={{ data, health, connectionState, latencyMs, stale, loading, error, refresh, client }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}
