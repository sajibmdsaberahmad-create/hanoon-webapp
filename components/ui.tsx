'use client';

import { getBridgeClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { TelemetrySnapshot } from '@/lib/types';
import type { ReactNode } from 'react';
import { useState } from 'react';

// ── Panel: standard surface with header ─────────────────────────────────────

export function Panel({
  title,
  badge,
  actions,
  children,
  className = '',
}: {
  title: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || badge || actions) && (
        <div className="panel-header">
          <div className="panel-title">
            <span className="dot dot-info" />
            {title}
            {badge && <span className="ml-1">{badge}</span>}
          </div>
          {actions}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}

// ── Section title inside a panel body ───────────────────────────────────────

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-hanoon-text-faint">
      {children}
    </div>
  );
}

// ── Metric tile ─────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  unit,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'error' | 'accent' | 'info' | 'halim';
}) {
  const toneClass: Record<string, string> = {
    default: 'text-hanoon-text',
    success: 'text-hanoon-success',
    warning: 'text-hanoon-warning',
    error: 'text-hanoon-error',
    accent: 'text-hanoon-accent',
    info: 'text-hanoon-nash',
    halim: 'text-hanoon-halim',
  };
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className={`metric-value sm ${toneClass[tone]}`}>
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-hanoon-text-faint">{unit}</span>}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-hanoon-text-faint">{hint}</div>}
    </div>
  );
}

// ── Empty / placeholder state ───────────────────────────────────────────────

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="inner-surface flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="text-xs font-semibold uppercase tracking-[0.1em] text-hanoon-text-faint">
        {title}
      </div>
      {description && (
        <div className="mt-1.5 max-w-sm text-xs text-hanoon-text-dim">{description}</div>
      )}
    </div>
  );
}

// ── Skeleton block for loading states ───────────────────────────────────────

export function Skeleton({ className = 'h-4' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-hanoon-border/60 ${className}`} />
  );
}

// ── Equity mini-chart (pure SVG) ────────────────────────────────────────────

interface EquityChartProps {
  history: Array<{ t: number; eq: number; sp: number }>;
}

export function EquityChart({ history }: EquityChartProps) {
  if (!history || history.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-hanoon-text-dim">
        No equity history yet
      </div>
    );
  }

  const values = history.map((h) => h.eq);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values
    .map((eq, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((eq - min) / range) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const up = last >= prev;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="metric-label">Equity curve</span>
        <span className={`tnum text-xs font-semibold ${up ? 'text-hanoon-success' : 'text-hanoon-error'}`}>
          {up ? '↑' : '↓'} {formatPrice(Math.abs(last - prev))}
        </span>
      </div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-24 w-full">
        <defs>
          <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={up ? '#34d399' : '#f87171'} stopOpacity="0.35" />
            <stop offset="100%" stopColor={up ? '#34d399' : '#f87171'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke={up ? '#34d399' : '#f87171'}
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />
        <polyline points={`0,40 ${points} 100,40`} fill="url(#eq-fill)" stroke="none" />
      </svg>
    </div>
  );
}

// ── Layer status bar (brains + infra) ───────────────────────────────────────

const LAYERS: Array<{
  key: string;
  label: string;
  active: (d: TelemetrySnapshot | null) => boolean;
  dot: string;
}> = [
  { key: 'juli', label: 'JULI', active: (d) => !!d?.brain, dot: 'dot-success' },
  {
    key: 'nash',
    label: 'Nash',
    active: (d) => !!d?.nash?.trained,
    dot: 'dot-info',
  },
  {
    key: 'halim',
    label: 'Halim',
    active: (d) => !!d?.halim?.active,
    dot: 'dot-halim',
  },
  {
    key: 'ib',
    label: 'IB Gateway',
    active: (d) => !!d?.vault?.ib_gateway,
    dot: 'dot-info',
  },
  {
    key: 'telemetry',
    label: 'Telemetry',
    active: (d) => !!d?.telemetry_hub?.running,
    dot: 'dot-warning',
  },
];

export function LayerStatusBar({
  data,
  latencyMs,
  stale,
  loading,
  error,
}: {
  data: TelemetrySnapshot | null;
  latencyMs: number;
  stale: boolean;
  loading: boolean;
  error: string | null;
}) {
  const live = !!data && !stale;

  return (
    <div className="inner-surface flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
      {LAYERS.map((l) => {
        const on = l.active(data);
        return (
          <div key={l.key} className="flex items-center gap-1.5">
            <span className={`dot ${on ? l.dot : ''}`} />
            <span
              className={`text-[11px] font-medium ${
                on ? 'text-hanoon-text' : 'text-hanoon-text-faint'
              }`}
            >
              {l.label}
            </span>
          </div>
        );
      })}

      <div className="ml-auto flex items-center gap-3">
        {error && !data && (
          <span className="text-[11px] font-medium text-hanoon-error">{error}</span>
        )}
        <span
          className={`flex items-center gap-1.5 text-[11px] font-medium ${
            live ? 'text-hanoon-success' : stale ? 'text-hanoon-warning' : 'text-hanoon-text-faint'
          }`}
        >
          <span className={`dot ${live ? 'dot-success dot-live' : stale ? 'dot-warning' : ''}`} />
          {loading ? 'Syncing…' : live ? 'Live' : stale ? 'Stale' : 'Offline'}
        </span>
        <span className="tnum text-[11px] text-hanoon-text-dim">{latencyMs}ms</span>
      </div>
    </div>
  );
}

// ── Control Panel: bot commands (legacy export) ─────────────────────────────

export function ControlPanel() {
  const client = getBridgeClient();
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string; ok: boolean } | null>(null);

  const sendCommand = async (action: string, payload: Record<string, unknown> = {}) => {
    setLoading(action);
    setResult(null);
    try {
      const res = await client.postCommand(action as any, payload);
      setResult({
        text: res.ok ? `${action}: OK` : `${action}: ${res.error || 'failed'}`,
        ok: res.ok,
      });
      if (action === 'pause') setPaused(true);
      if (action === 'resume') setPaused(false);
    } catch (err: any) {
      setResult({ text: `${action}: ${err.message}`, ok: false });
    }
    setLoading(null);
  };

  const buttons = [
    { label: paused ? 'Resume' : 'Pause', action: paused ? 'resume' : 'pause', className: 'btn-warning' },
    { label: 'Flatten All', action: 'flatten_all', className: 'btn-danger' },
    { label: 'Sleep', action: 'sleep', className: 'btn' },
    { label: 'Wake', action: 'wake', className: 'btn-success' },
    { label: 'Force Retrain', action: 'force_retrain', className: 'btn-halim' },
    { label: 'Force Review', action: 'force_review', className: 'btn-info' },
  ];

  return (
    <Panel title="Bot controls">
      <div className="grid grid-cols-2 gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.action}
            onClick={() => sendCommand(btn.action)}
            disabled={loading === btn.action}
            className={`btn ${btn.className}`}
          >
            {loading === btn.action ? 'Sending…' : btn.label}
          </button>
        ))}
      </div>
      {result && (
        <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${result.ok ? 'border-hanoon-success/30 text-hanoon-success' : 'border-hanoon-error/30 text-hanoon-error'}`}>
          {result.text}
        </div>
      )}
    </Panel>
  );
}

