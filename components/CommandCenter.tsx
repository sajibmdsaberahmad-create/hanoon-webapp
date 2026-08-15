'use client';

import { useState } from 'react';
import {
  PauseIcon,
  PlayIcon,
  ShieldExclamationIcon,
  MoonIcon,
  SunIcon,
  LockClosedIcon,
  ArrowsRightLeftIcon,
  BoltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useTelemetry } from '@/components/TelemetryProvider';
import { getBridgeClient } from '@/lib/api';
import { Panel, SectionTitle } from '@/components/ui';

/**
 * CommandCenter — the actionable bridge controls.
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
        ? { text: `${label} → sent to bot`, tone: 'ok' }
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

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* ── Emergency ── */}
      <Panel title="Emergency controls">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            className="btn btn-danger"
            disabled={!!busy}
            onClick={() => confirmDanger('Flatten All', 'flatten')}
          >
            <ShieldExclamationIcon className="h-4 w-4" />
            Flatten All
          </button>
          <button
            className="btn btn-warning"
            disabled={!!busy}
            onClick={() => confirmDanger('Defensive Mode', 'defensive')}
          >
            <ShieldExclamationIcon className="h-4 w-4" />
            Defensive
          </button>
          <button
            className="btn btn-warning"
            disabled={!!busy}
            onClick={() => run('pause', 'Pause trading')}
          >
            <PauseIcon className="h-4 w-4" />
            Pause
          </button>
          <button
            className="btn btn-success"
            disabled={!!busy}
            onClick={() => run('resume', 'Resume trading')}
          >
            <PlayIcon className="h-4 w-4" />
            Resume
          </button>
        </div>
      </Panel>

      {/* ── Sleep / schedule ── */}
      <Panel
        title="Sleep & schedule"
        badge={
          <span
            className={`badge ${sleeping ? 'badge-warning' : 'badge-success'}`}
          >
            <span className={`dot ${sleeping ? 'dot-warning' : 'dot-success dot-live'}`} />
            {sleeping ? 'Sleeping' : 'Active'}
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn btn-warning"
            disabled={!!busy}
            onClick={() => run('sleep', 'Sleep now', { reason: 'manual' })}
          >
            <MoonIcon className="h-4 w-4" />
            Sleep Now
          </button>
          <button
            className="btn btn-success"
            disabled={!!busy}
            onClick={() => run('wake', 'Wake now', { reason: 'manual' })}
          >
            <SunIcon className="h-4 w-4" />
            Wake Now
          </button>
        </div>

        <div className="mt-4">
          <SectionTitle>Trading sessions (ET)</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {SESSIONS.map((s) => {
              const on = sessions.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSession(s.id)}
                  className={`btn ${on ? 'btn-success' : ''}`}
                >
                  {on && <CheckCircleIcon className="h-4 w-4" />}
                  {s.label}
                  <span className="text-hanoon-text-faint">{s.sub}</span>
                </button>
              );
            })}
          </div>
          <button
            className={`btn btn-success mt-3 ${sessDirty ? 'animate-pulse-slow' : ''}`}
            disabled={!!busy}
            onClick={applySessions}
          >
            <ChevronRightIcon className="h-4 w-4" />
            {sessDirty ? 'Apply Sessions' : 'Apply Sessions'}
          </button>
        </div>
      </Panel>

      {/* ── Direction ── */}
      <Panel
        title="Trading direction"
        badge={
          <span
            className={`badge ${longOnly ? 'badge-info' : 'badge-warning'}`}
          >
            <span className={`dot ${longOnly ? 'dot-info' : 'dot-warning'}`} />
            {longOnly ? 'Long-only' : 'Shorts allowed'}
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn btn-info"
            disabled={!!busy}
            onClick={() => run('set_long_only', 'Long-only ON', { enabled: 'true' })}
          >
            <LockClosedIcon className="h-4 w-4" />
            Long-Only ON
          </button>
          <button
            className="btn btn-warning"
            disabled={!!busy}
            onClick={() => run('set_long_only', 'Allow shorts', { enabled: 'false' })}
          >
            <ArrowsRightLeftIcon className="h-4 w-4" />
            Allow Shorts
          </button>
        </div>
      </Panel>

      {/* ── Feedback ── */}
      {feedback && (
        <div
          className={`animate-fade-in flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
            feedback.tone === 'ok'
              ? 'border-hanoon-success/30 text-hanoon-success'
              : feedback.tone === 'err'
              ? 'border-hanoon-error/30 text-hanoon-error'
              : 'border-hanoon-warning/30 text-hanoon-warning'
          }`}
        >
          {feedback.tone === 'ok' ? (
            <CheckCircleIcon className="h-4 w-4" />
          ) : feedback.tone === 'err' ? (
            <XCircleIcon className="h-4 w-4" />
          ) : (
            <BoltIcon className="h-4 w-4 animate-pulse" />
          )}
          {feedback.text}
        </div>
      )}
    </div>
  );
}
