/**
 * Utility functions for the HANOON webapp.
 */

import type { PositionDetail } from './types';

// ── Formatting ─────────────────────────────────────────────────────────

export function formatPrice(val: number | null | undefined): string {
  if (val == null || (typeof val === 'number' && (Number.isNaN(val) || !isFinite(val)))) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatPercent(val: number | null | undefined): string {
  if (val == null || (typeof val === 'number' && (val !== val || !isFinite(val)))) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

export function formatCurrency(val: number | null | undefined): string {
  if (val == null || (typeof val === 'number' && (val !== val || !isFinite(val)))) return '—';
  const sign = val >= 0 ? '+' : '';
  const abs = Math.abs(val);
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${val.toFixed(2)}`;
}

export function formatTime(ts: number | null | undefined): string {
  if (ts == null) return '—';
  return new Date(ts * 1000).toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatScore(val: number | null | undefined): string {
  if (val == null || (typeof val === 'number' && (val !== val || !isFinite(val)))) return '—';
  return val.toFixed(4);
}

export function clamp(val: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, val));
}

// ── Color helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function pnlColor(pnl: number): string {
  return pnl >= 0 ? 'text-hanoon-success' : 'text-hanoon-error';
}

export function verdictColor(verdict: string): string {
  switch (verdict) {
    case 'BUY': return 'text-hanoon-success';
    case 'SELL': return 'text-hanoon-error';
    case 'HOLD': return 'text-hanoon-warning';
    default: return 'text-hanoon-text-dim';
  }
}

export function healthColor(score: number): string {
  if (score >= 0.6) return 'text-hanoon-error';
  if (score >= 0.3) return 'text-hanoon-warning';
  return 'text-hanoon-success';
}

export function sleepColor(state: string): string {
  if (state === 'awake') return 'text-hanoon-success';
  if (state === 'weekend' || state === 'closed') return 'text-hanoon-text-dim';
  if (state === 'risk_event' || state === 'stress') return 'text-hanoon-error';
  return 'text-hanoon-warning';
}

// ── Position math ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function computePnLPercent(entry: number, current: number, direction: number): number {
  const pct = ((current - entry) / entry) * direction * 100;
  return pct;
}

export function computeRr(entry: number, stop: number, target: number): number {
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(target - entry);
  return risk > 0 ? reward / risk : 0;
}

// ── Progress bar helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function pctBar(pct: number): { width: string; color: string } {
  const clamped = clamp(pct, 0, 1);
  const width = `${clamped * 100}%`;
  let color = 'bg-hanoon-accent';
  if (pct >= 0.8) color = 'bg-hanoon-error';
  else if (pct >= 0.5) color = 'bg-hanoon-warning';
  else if (pct >= 0.3) color = 'bg-hanoon-accent';
  else color = 'bg-hanoon-success';
  return { width, color };
}
