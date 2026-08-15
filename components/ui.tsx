import { getBridgeClient } from '@/lib/api';
import { formatPercent } from '@/lib/utils';
import { useEffect, useState } from 'react';

// ── Control Panel: bot commands ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ControlPanel() {
  const client = getBridgeClient();
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const sendCommand = async (action: string, payload: Record<string, unknown> = {}) => {
    setLoading(action);
    setResult(null);
    try {
      const res = await client.postCommand(action as any, payload);
      setResult(res.ok
        ? `✅ ${action}: OK`
        : `❌ ${action}: ${res.error || 'failed'}`
      );
      if (action === 'pause') setPaused(true);
      if (action === 'resume') setPaused(false);
    } catch (err: any) {
      setResult(`❌ ${action}: ${err.message}`);
    }
    setLoading(null);
  };

  const buttons = [
    { label: paused ? 'Resume' : 'Pause', action: paused ? 'resume' : 'pause', color: 'border-hanoon-warning text-hanoon-warning' },
    { label: 'Flatten All', action: 'flatten_all', color: 'border-hanoon-error text-hanoon-error' },
    { label: 'Sleep', action: 'sleep', color: 'border-hanoon-text-dim text-hanoon-text-dim' },
    { label: 'Wake', action: 'wake', color: 'border-hanoon-success text-hanoon-success' },
    { label: 'Force Retrain', action: 'force_retrain', color: 'border-hanoon-halim text-hanoon-halim' },
    { label: 'Force Review', action: 'force_review', color: 'border-hanoon-nash text-hanoon-nash' },
  ];

  return (
    <div className="bg-hanoon-panel border border-hanoon-border rounded p-3">
      <div className="text-xs text-hanoon-text-dim mb-2">Bot Controls</div>
      <div className="grid grid-cols-3 gap-1.5">
        {buttons.map((btn) => (
          <button
            key={btn.action}
            onClick={() => sendCommand(btn.action)}
            disabled={loading === btn.action}
            className={`px-2 py-1.5 text-xs border rounded hover:bg-hanoon-bg transition text-center disabled:opacity-50 ${btn.color}`}
          >
            {loading === btn.action ? '⏳' : btn.label}
          </button>
        ))}
      </div>
      {result && <div className="mt-2 text-xs font-mono">{result}</div>}
    </div>
  );
}

// ── Equity mini-chart ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface EquityChartProps {
  history: Array<{ t: number; eq: number; sp: number }>;
}

export function EquityChart({ history }: EquityChartProps) {
  if (!history || history.length < 2) {
    return (
      <div className="h-16 flex items-end justify-center text-hanoon-text-dim text-xs">
        No equity history
      </div>
    );
  }

  const max = Math.max(...history.map((h) => h.eq), 1);
  const min = Math.min(...history.map((h) => h.eq), 0);
  const range = max - min || 1;

  const points = history.map((h, i) => {
    const x = (i / (history.length - 1)) * 100;
    const y = 100 - ((h.eq - min) / range) * 100;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const delta = last.eq - prev.eq;
  const deltaClass = delta >= 0 ? 'text-hanoon-success' : 'text-hanoon-error';

  return (
    <div className="h-full">
      <div className="h-12">
        <svg width="100%" height="48" viewBox="0 0 200 48" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke="#00d4aa"
            strokeWidth="0.5"
            opacity="0.8"
          />
          <polyline
            points={points}
            fill="rgba(0, 212, 170, 0.1)"
            stroke="none"
          />
        </svg>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-hanoon-text-dim">Equity: {last.eq.toFixed(2)}</span>
        <span className={deltaClass}>Δ {delta >= 0 ? '+' : ''}{delta.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ── Mini stat card ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  color?: string;
  onClick?: () => void;
}

export function StatCard({ label, value, unit, trend, color, onClick }: StatCardProps) {
  const trendIcon = {
    up: '↗',
    down: '↘',
    flat: '→',
  }[trend || 'flat'];

  const trendColor = trend === 'up' ? 'text-hanoon-success' :
    trend === 'down' ? 'text-hanoon-error' : 'text-hanoon-text-dim';

  return (
    <div
      onClick={onClick}
      className={`bg-hanoon-panel border border-hanoon-border rounded p-2 cursor-${onClick ? 'pointer' : 'default'} hover:border-hanoon-accent transition`}
    >
      <div className="text-xs text-hanoon-text-dim uppercase">{label}</div>
      <div className="text-lg font-medium text-hanoon-text flex items-center gap-1">
        <span className={color || ''}>{value}</span>
        {unit && <span className="text-xs text-hanoon-text-dim">{unit}</span>}
        <span className={`text-xs ${trendColor}`}>{trendIcon}</span>
      </div>
    </div>
  );
}
