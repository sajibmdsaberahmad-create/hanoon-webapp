/**
 * HANOON 3.0 Telemetry API Client.
 *
 * Connects to the HANOON bot's TelemetryAPI (ops/api.py) via the Vercel
 * proxy route (/api/bridge/...). Handles reconnection with exponential
 * backoff and stale-data detection.
 */

import type {
  TelemetrySnapshot,
  HealthResponse,
  CommandResult,
  BotCommand,
} from './types';

// ── Configuration ─────────────────────────────────────────────────────

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'stale'
  | 'error';

export interface ApiResponse<T = any> {
  data: T | null;
  ok: boolean;
  status: number;
  error: string | null;
  connectionState: ConnectionState;
  latencyMs: number;
  stale: boolean;
}

const PROXY_BASE = '/api/bridge';
const DEFAULT_POLL_INTERVAL = Number(
  process.env.NEXT_PUBLIC_POLL_INTERVAL_MS || '5000',
);
const STALE_THRESHOLD_MS = 12000;
const MAX_BACKOFF_MS = 30000;
const INITIAL_BACKOFF_MS = 5000;
const BACKOFF_MULTIPLIER = 2;
const REQUEST_TIMEOUT_MS = 8000;

// ── Bridge API Client ─────────────────────────────────────────────────

export class BridgeClient {
  private baseUrl: string;
  private pollInterval: number;
  private currentState: ConnectionState = 'disconnected';
  private currentBackoff: number = INITIAL_BACKOFF_MS;
  private consecutiveFailures: number = 0;

  constructor(
    baseUrl: string = PROXY_BASE,
    pollInterval: number = DEFAULT_POLL_INTERVAL,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.pollInterval = pollInterval;
  }

  get state(): ConnectionState {
    return this.currentState;
  }

  get backoff(): number {
    return this.currentBackoff;
  }

  get failures(): number {
    return this.consecutiveFailures;
  }

  /**
   * Fetch a single endpoint from the bridge.
   */
  async fetchEndpoint(
    path: string,
    retries: number = 3,
    retryDelay: number = 800,
  ): Promise<ApiResponse<any>> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let lastError: string | null = null;
    let latency = 0;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const start = Date.now();
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
          next: { revalidate: 0 },
        });
        latency = Date.now() - start;
        clearTimeout(timeoutId);

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          lastError = `HTTP ${response.status}: ${response.statusText}${
            body ? ` — ${body.slice(0, 200)}` : ''
          }`;
          if (attempt < retries) {
            await this._sleep(retryDelay * (attempt + 1));
            continue;
          }
          return this._errorResponse(lastError, latency);
        }

        const text = await response.text();
        if (!text || text.trim() === '') {
          lastError = 'Empty response body';
          if (attempt < retries) {
            await this._sleep(retryDelay * (attempt + 1));
            continue;
          }
          return this._errorResponse(lastError, latency);
        }

        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          lastError = `Invalid JSON: ${text.slice(0, 100)}`;
          if (attempt < retries) {
            await this._sleep(retryDelay * (attempt + 1));
            continue;
          }
          return this._errorResponse(lastError, latency);
        }

        this._onSuccess();
        return {
          data,
          ok: true,
          status: 200,
          error: null,
          connectionState: 'connected',
          latencyMs: latency,
          stale: this._isStale(data),
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError =
          err.name === 'AbortError'
            ? `Timeout after ${REQUEST_TIMEOUT_MS}ms`
            : err.message || String(err);
        this._onFailure(lastError ?? 'Unknown error');
      }
    }

    return this._errorResponse(lastError || 'Unknown error', latency);
  }

  /**
   * Post a command to the bridge.
   */
  async postCommand(
    action: BotCommand,
    payload: Record<string, unknown> = {},
  ): Promise<ApiResponse<CommandResult>> {
    const url = `${this.baseUrl}/command`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const start = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, ...payload }),
        signal: controller.signal,
        next: { revalidate: 0 },
      });
      const latency = Date.now() - start;
      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return this._errorResponse(
          `HTTP ${response.status}: ${text.slice(0, 200)}`,
          latency,
        );
      }

      const data = await response.json().catch(() => ({}));
      this._onSuccess();
      return {
        data,
        ok: true,
        status: 200,
        error: null,
        connectionState: 'connected',
        latencyMs: latency,
        stale: false,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const error =
        err.name === 'AbortError'
          ? `Timeout after ${REQUEST_TIMEOUT_MS}ms`
          : err.message || String(err);
      this._onFailure(error);
      return this._errorResponse(error, 0);
    }
  }

  /**
   * Poll all telemetry endpoints in parallel.
   */
  async fetchTelemetry(): Promise<ApiResponse<TelemetrySnapshot>> {
    return this.fetchEndpoint('/telemetry') as Promise<ApiResponse<TelemetrySnapshot>>;
  }

  /**
   * Poll all endpoints and return consolidated results.
   */
  async fetchAll(): Promise<{
    telemetry: ApiResponse<TelemetrySnapshot>;
    health: ApiResponse<HealthResponse>;
    trades: ApiResponse<any>;
  }> {
    const endpoints = [
      this.fetchEndpoint('/telemetry'),
      this.fetchEndpoint('/health'),
      this.fetchEndpoint('/trades'),
    ];
    const [telemetry, health, trades] = await Promise.allSettled(endpoints);

    return {
      telemetry:
        telemetry.status === 'fulfilled'
          ? telemetry.value
          : this._errorResponse('Rejected', 0),
      health:
        health.status === 'fulfilled'
          ? health.value
          : this._errorResponse('Rejected', 0),
      trades:
        trades.status === 'fulfilled'
          ? trades.value
          : this._errorResponse('Rejected', 0),
    };
  }

  async reconnect(): Promise<boolean> {
    this._resetBackoff();
    const result = await this.fetchEndpoint('/health', 1, 500);
    return result.ok;
  }

  destroy(): void {
    // No timers to clean up in this simplified version
  }

  // ── Private ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private _onSuccess(): void {
    this.consecutiveFailures = 0;
    this.currentBackoff = INITIAL_BACKOFF_MS;
    if (this.currentState !== 'connected') {
      this.currentState = 'connected';
    }
  }

  private _onFailure(_error: string): void {
    this.consecutiveFailures++;
    this.currentBackoff = Math.min(
      this.currentBackoff * BACKOFF_MULTIPLIER,
      MAX_BACKOFF_MS,
    );
    if (this.consecutiveFailures >= 3) {
      this.currentState = 'error';
    } else {
      this.currentState = 'disconnected';
    }
  }

  private _isStale(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    const ts = data.ts || data.timestamp;
    if (!ts) return false;
    const age = Date.now() - Number(ts) * 1000;
    return age > STALE_THRESHOLD_MS;
  }

  private _resetBackoff(): void {
    this.currentBackoff = INITIAL_BACKOFF_MS;
    this.consecutiveFailures = 0;
  }

  private _errorResponse(error: string, latency: number): ApiResponse {
    return {
      data: null,
      ok: false,
      status: 0,
      error,
      connectionState: this.currentState,
      latencyMs: latency,
      stale: false,
    };
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ── Singleton ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let _client: BridgeClient | null = null;

export function getBridgeClient(): BridgeClient {
  if (!_client) {
    _client = new BridgeClient();
  }
  return _client;
}

// Re-export types
export type { TelemetrySnapshot, HealthResponse, CommandResult, BotCommand };
