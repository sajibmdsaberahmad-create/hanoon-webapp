'use client';

import { useState } from 'react';
import { useTelemetry } from '@/components/TelemetryProvider';
import { getBridgeClient } from '@/lib/api';

/**
 * CommandCenter — the actionable bridge controls (classic dashboard).
 * Every button POSTs to /command; the bot's runner executes on its own
 * thread. Dangerous actions require confirm().
 *
 * Controls:
 *  - Emergency: Flatten All · Defensive · Pause · Resume
 *  - Sleep: Sleep Now · Wake Now
 *  - Schedule: trading sessions pre / rth / post / overnight + Apply
 *  - Direction: Long-Only ON · Allow Shorts
 */

const SESSIONS = [
  { id: 'pre', label: 'Pre', sub: '4a–9:30a' },
  { id: 'rth', label: 'RTH', sub: '9:30a–4p' },
  { id: 'post', label: 'Post', sub: '4p–8p' },
  { id: 'overnight', label: 'Overnight', sub: '8p–4a' },
];

type Feedback = { text: string; tone: 'ok' | 'err' | 'pending' } | null;

export function CommandCenter() {
  const client = getBridgeClient();
  const { data } = useTelemetry();
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [sessions, setSessions] = useState<string[]>(() => {
    const s = (data?.sleep as any)?.trading_sessions;
    return Array.isArray(s) && s.length > 0 ? s : ['rth'];
  });
  const [sessDirty, setSessDirty] = useState(false);

  const sleeping = (data?.sleep as any)?.is_active === true;
  const longOnly = (data as any)?.long_only === true;

  async function run(action: string, label: string, payload: Record<string, unknown> = {}) {
    if (busy) return;
    setBusy(action);
    setFeedback({ text: `${label}…`, tone: 'pending' });
    const res = await client.postCommand(action as any, payload);
    setFeedback(
      res.ok
        ? { text: `${label} → sent to bot ✓`, tone: 'ok' }
        : { text: `${label} → ${res.error || 'FAILED'}`, tone: 'err' }
    );
    setBusy(null);
  }

  function confirmDanger(label: string, action: string) {
    if (!window.confirm(`Send "${label}" to the bot?`)) return;
    run(action, label);
  }

  function toggleSession(id: string) {
    setSessions((prev) => {
      const next = prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id];
      setSessDirty(true);
      return next;
    });
  }

  function applySessions() {
    if (sessions.length === 0) {
      setFeedback({ text: 'Select at least one session', tone: 'err' });
      return;
    }
    setSessDirty(false);
    run('set_sessions', 'Apply sessions', { sessions: sessions.join(',') });
  }

  const btnBase =
    'px-3 py-2.5 rounded-lg border text-xs font-bold font-mono transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md';

  return (
    <div className="space-y-5">
      {/* ── Emergency ── */}
      <section className="glass glass-hover rounded-2xl p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
          Emergency Controls
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            className={`${btnBase} text-red-400 border-red-500/40 bg-red-500/10 hover:bg-red-500/20`}
            disabled={!!busy}
            onClick={() => confirmDanger('Flatten All', 'flatten')}
          >
            🚨 Flatten All
          </button>
          <button
            className={`${btnBase} text-amber-400 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20`}
            disabled={!!busy}
            onClick={() => confirmDanger('Defensive Mode', 'defensive')}
          >
            🛡️ Defensive
          </button>
          <button
            className={`${btnBase} text-green-400 border-green-500/40 bg-green-500/10 hover:bg-green-500/20`}
            disabled={!!busy}
            onClick={() => run('pause', 'Pause trading')}
          >
            ⏸ Pause
          </button>
          <button
            className={`${btnBase} text-green-400 border-green-500/40 bg-green-500/10 hover:bg-green-500/20`}
            disabled={!!busy}
            onClick={() => run('resume', 'Resume trading')}
          >
            ▶ Resume
          </button>
        </div>
      </section>

      {/* ── Sleep / schedule ── */}
      <section className="glass glass-hover rounded-2xl p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
          Sleep & Schedule
          <span
            className={`ml-2 px-2 py-0.5 rounded-full font-mono text-[9px] ${
              sleeping
                ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                : 'text-green-400 bg-green-500/10 border border-green-500/30'
            }`}
          >
            {sleeping ? '😴 SLEEPING' : '☀️ ACTIVE'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            className={`${btnBase} text-amber-400 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20`}
            disabled={!!busy}
            onClick={() => run('sleep', 'Sleep now', { reason: 'manual' })}
          >
            😴 Sleep Now
          </button>
          <button
            className={`${btnBase} text-green-400 border-green-500/40 bg-green-500/10 hover:bg-green-500/20`}
            disabled={!!busy}
            onClick={() => run('wake', 'Wake now', { reason: 'manual' })}
          >
            ☀️ Wake Now
          </button>
        </div>

        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
          Trading Sessions (ET)
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {SESSIONS.map((s) => {
            const on = sessions.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleSession(s.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all active:scale-95 ${
                  on
                    ? 'text-emerald-300 border-emerald-500/50 bg-emerald-500/15 backdrop-blur-md'
                    : 'text-gray-500 border-white/10 bg-white/5 backdrop-blur-md hover:text-gray-300'
                }`}
              >
                {s.label}
                <span className="ml-1 text-[9px] opacity-70">{s.sub}</span>
              </button>
            );
          })}
        </div>
        <button
          className={`${btnBase} w-full sm:w-auto text-emerald-300 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 ${
            sessDirty ? 'border-pulse' : ''
          }`}
          disabled={!!busy}
          onClick={applySessions}
        >
          {sessDirty ? 'Apply Sessions ●' : 'Apply Sessions'}
        </button>
      </section>

      {/* ── Direction ── */}
      <section className="glass glass-hover rounded-2xl p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
          Trading Direction
          <span
            className={`ml-2 px-2 py-0.5 rounded-full font-mono text-[9px] ${
              longOnly
                ? 'text-blue-400 bg-blue-500/10 border border-blue-500/30'
                : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            {longOnly ? '🔒 LONG-ONLY' : '⇅ SHORTS ALLOWED'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`${btnBase} text-blue-400 border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20`}
            disabled={!!busy}
            onClick={() => run('set_long_only', 'Long-only ON', { enabled: 'true' })}
          >
            Long-Only ON
          </button>
          <button
            className={`${btnBase} text-amber-400 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20`}
            disabled={!!busy}
            onClick={() => run('set_long_only', 'Allow shorts', { enabled: 'false' })}
          >
            Allow Shorts
          </button>
        </div>
      </section>

      {/* ── Feedback ── */}
      {feedback && (
        <div
          className={`text-xs font-mono px-3 py-2 rounded-lg border ${
            feedback.tone === 'ok'
              ? 'text-green-400 border-green-500/30 bg-green-500/10'
              : feedback.tone === 'err'
              ? 'text-red-400 border-red-500/30 bg-red-500/10'
              : 'text-amber-400 border-amber-500/30 bg-amber-500/10 animate-pulse'
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}
