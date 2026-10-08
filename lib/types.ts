/**
 * TypeScript type definitions for ALL HANOON 3.0 telemetry fields.
 *
 * This file mirrors the telemetry produced by the HANOON 3.0 bot's
 * TelemetryAPI (ops/api.py) and TelemetryHub (monitoring/telemetry.py).
 * Every field below corresponds to a real metric from a specific layer.
 *
 * Layer mapping:
 *   L0 Foundations → system, config, health
 *   L1 Senses → positions, ib_intel, regime, session_phase
 *   L2 Brains → juli, nash, halim
 *   L3 Execution/Risk → trades, portfolio, exposure
 *   L4 Reflection → buffer, retrain
 *   L5 Monitoring → watchdog, sleep, monitoring
 *   L6 Ops → runner, api
 */

// ── System Health ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SystemMetrics {
  cpu_pct: number;
  memory_pct: number;
  memory_rss_mb: number;
  disk_pct: number;
}

export interface ComponentStatus {
  running: boolean;
  ib_connected: boolean;
  panic_mode: boolean;
  panic_reason: string;
}

export interface HealthResponse {
  ok: boolean;
  last_update_s: number;
  ts: number;
  service: string;
}

// ── L1: Senses ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PositionDetail {
  ticker: string;
  direction: number;          // +1 long, -1 short
  size: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  pnl: number;
  pnl_pct: number;
  stop_price: number;
  target_price: number;
  rr: number;
  confidence: number;
  entry_time: number;
  health_score: number;        // [0, 1] from JULI exit re-score
  health_verdict: string;      // STAY / THINK / EXIT / EXIT_HARD
  tbt_urgency: number;         // TBT subscription urgency (0.1–3.0)
  // What JULI thinks about this position RIGHT NOW (live exit re-score):
  juli_thinking?: {
    ts: number;
    score: number;             // health [0,1]
    juli_score: number;        // raw JULI composite
    confidence: number;
    win_prob: number;
    ev_enter: number;
    verdict: string;           // STAY / THINK / EXIT / EXIT_HARD
    prediction: string;        // HOLD / WATCH / EXIT
    direction_hint: number;
    entry_price: number;
    current_price: number;
    stop_price: number;
    target_price: number;
    triggers: Record<string, number>;
    indicators: Record<string, number>;
  };
}

export interface IbIntel {
  ib_active: boolean;
  ib_server_time_offset: number;
  ib_drift_alert: boolean;
  tick_last_update: number;
  tick_stale_duration: number;
}

export interface SleepState {
  sleep_state: string;      // awake / market_closed / user_window / failure / stress
  sleep_reason: string;
  is_active: boolean;
  last_check: number;
  session?: string;              // pre / rth / post / overnight
  enabled_sessions?: string[];   // e.g. ['rth'] — webapp set_sessions
}

// ── L2: Brains ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface JuliSignal {
  verdict: string;           // BUY / SELL / HOLD
  score: number;             // [0.10, 0.70]
  confidence: number;        // [0.50, 1.00]
  win_prob: number;          // [0.18, 0.35]
  ev: number;                // expected value
  kelly: number;             // Kelly fraction
  direction: number;         // +1 / -1 / 0
  alpha: Record<string, number>;  // 34 named signal keys
  thinking_trace: Record<string, any>;  // 5 cognitive pillars
  threshold: number;
  threshold_min: number;
  threshold_max: number;
}

export interface NashOpinion {
  opinion: number;            // bounded ±0.03
  confidence: number;
  gate_authority: boolean;   // true only when BR ≥ 0.45 with ≥ 20 samples
  gate_veto: boolean;
  n_samples: number;
  n_real_rows: number;
  trained: boolean;
}

export interface HalimState {
  trust: number;              // [0.0, 1.0], initial 0.5
  advisory: "approve" | "reject" | "hold";  // current advice
  pull: number;               // bounded ±0.03 modifier
  last_advice: Record<string, any>;
  active: boolean;            // whether Halim serve is running
  model: string;              // model name
  phase: string;              // child/toddler/adult
}

export interface HalimDebate {
  ticker: string;
  direction_hint: number;
  confidence: number;
  verdict: string;
  pull: number;
}

// ── L2: JULI Learning ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface JuliLearning {
  patterns_learned: number;
  recent_win_rate: number;
  weight_adjustments: number;
  decision_count: number;
  loss_streak: number;
  win_streak: number;
  dynamic_threshold: number;
  goal_gap: number;
  // Live API contract (bridge_api.py `learning` block): fraction win_rate
  patterns?: number;
  win_rate?: number;
  total_adjustments?: number;
}

export interface WeightState {
  weights: Record<string, number>;
  learned_gate: number;
  calibration_bins: Record<string, any>;
  episodic_count: number;
}

// ── L3: Execution ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Trade {
  ticker: string;
  side: string;               // BUY / SELL
  action: string;             // BUY / SELL
  qty: number;
  price: number;
  avg_price: number;
  commission: number;
  realized_pnl: number;
  ts: number;
  exec_id: string;
  exit_reason?: string;
  hold_min?: number;
  // JULI's entry decision (what the brain thought at entry)
  juli?: {
    score: number;
    direction: number;
    confidence: number;
    verdict: string;
    trace: string;
  };
  // Halim's parallel call at entry
  halim_entry?: {
    direction: number;
    confidence: number;
    reason: string;
  };
  // Halim's POSTMORTEM — own decision on full data + lesson + debate
  halim_postmortem?: {
    decision: { direction: number; confidence: number; reason: string } | null;
    lesson: string;
    debate: string;
  };
  gold_saved?: boolean;       // SFT gold written for Halim retraining
  goal?: string;              // JULI's goal for the trade
}

export interface BracketState {
  ticker: string;
  entry_price: number;
  stop_price: number;
  target_price: number;
  rr_ratio: number;
  direction: number;
  entry_time: number;
  active: boolean;
}

// ── L3: Risk ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PortfolioRisk {
  equity: number;
  peak_equity: number;
  drawdown: number;
  risk_scalar: number;
  stress_mode: boolean;
  exposure: number;
  position_count: number;
  max_positions: number;
  portfolio_cap: number;
  concentration: number;
}

export interface FeeBreakdown {
  fixed_fee: number;
  rate_fee: number;
  total: number;
  rr_floor: number;
}

// ── L4: Reflection ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TradeRecord {
  trade_id: string;
  ticker: string;
  entry_price: number;
  exit_price: number;
  qty: number;
  pnl: number;
  pnl_pct: number;
  fees: number;
  win: boolean;
  direction: number;
  entry_time: number;
  exit_time: number;
  hold_sec: number;
  exit_reason: string;
}

export interface BufferTelemetry {
  trade_count: number;
  open_positions: number;
  win_rate: number;
  total_pnl: number;
}

export interface RetrainState {
  retrained_count: number;
  max_per_session: number;
  model_path: string;
}

export interface ReviewReport {
  summary: {
    total_trades: number;
    win_rate: number;
    total_pnl: number;
    avg_pnl: number;
    profit_factor: number;
  };
  per_ticker: Record<string, { count: number; wr: number; pnl: number }>;
  per_indicator: Record<string, { wr: number; count: number; pnl: number }>;
  action_items: string[];
}

export interface SupervisorTelemetry {
  halim_attached: boolean;
  last_daily_review: number;
  last_weekly_review: number;
  last_retrain: number;
  buffer: BufferTelemetry;
  retrain: RetrainState;
}

// ── L5: Monitoring ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface WatchdogTelemetry {
  running: boolean;
  ib_connected: boolean;
  ib_time_offset: number;
  panic_mode: boolean;
  panic_reason: string;
  tick_count: number;
  stale_ticks: number;
  heartbeats: Record<string, number>;
}

export interface PositionMonitorTelemetry {
  running: boolean;
  pulse_sec: number;
  positions_monitored: number;
  brackets: Record<string, any>;
  portfolio: PortfolioRisk;
  urgencies: Record<string, number>;
  buffer: BufferTelemetry;
}

export interface TelemetryHubState {
  running: boolean;
  push_interval: number;
  history_size: number;
  start_time: number;
  uptime_sec: number;
}

// ── L6: Ops ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface RunnerTelemetry {
  running: boolean;
  cycle_count: number;
  recent_actions: Array<{
    ts: number;
    ticker: string;
    action: string;
    score: number;
    direction: number;
    halim: number;
    nash: number;
  }>;
}

export interface ApiTelemetry {
  running: boolean;
  host: string;
  port: number;
  paused: boolean;
}

export interface VaultState {
  halim_serve: boolean;
  ib_gateway: boolean;
  ngrok: boolean;
  tunnel: boolean;
}

// ── Combined Telemetry Snapshot ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TelemetrySnapshot {
  // Core
  ts: number;
  uptime_sec: number;
  system: SystemMetrics;

  // L1: Senses
  equity: number;
  cash: number;
  drawdown_pct: number;
  positions: Array<PositionDetail>;
  ib_intel: IbIntel;
  sleep: SleepState;
  regime: string;

  // L2: Brains
  brain: {
    score: number;
    direction: number;
    confidence: number;
    win_prob: number;
    ev: number;
    kelly: number;
    verdict: string;
    alpha: Record<string, number>;
    thinking_trace: Record<string, any>;
    threshold: number;
  };
  meta_label_dnn: {
    p_win: number;
    verdict_raw: string;
    healthy: boolean; // false => degraded gatekeeper → fail-open (admit)
    obi: number;
    vpin: number;
    price_entropy: number;
    vol_entropy: number;
    drift_zscore: number;
    feature_zero_streak: { obi: number; vpin: number };
    last_size_scale: number;
  };
  nash: NashOpinion;
  halim: {
    trust: number;
    pull: number;
    advisory: string;
    active: boolean;
    model: string;
    phase: string;
  };
  learning: JuliLearning;
  weights: WeightState;

  // L3: Execution
  trades: Trade[];
  brackets: Array<BracketState>;
  buffer: BufferTelemetry;

  // L3: Risk
  portfolio: PortfolioRisk;

  // L4: Reflection
  supervisor: SupervisorTelemetry;
  review: ReviewReport | null;

  // L5: Monitoring
  watchdog: WatchdogTelemetry;
  monitor: PositionMonitorTelemetry;
  telemetry_hub: TelemetryHubState;

  // L6: Ops
  runner: RunnerTelemetry;
  api: ApiTelemetry;
  vault: VaultState;
  paused: boolean;

  // What JULI thinks about every scanned ticker (score/ev/conf/prediction)
  scan_views?: Record<string, {
    ts: number;
    score: number;
    direction: number;
    direction_label: string;
    confidence: number;
    ev: number;
    ev_enter: boolean;
    halim_approved: boolean;
    halim_pull: number;
    prediction: string;
    indicators: Record<string, number>;
  }>;
  // What JULI thinks about every open position (full exit re-score)
  exit_views?: Record<string, any>;

  // Legacy compatibility
  [key: string]: any;
}

// ── Command interface ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━═════

export type BotCommand =
  | "pause"
  | "resume"
  | "flatten_all"
  | "flatten"
  | "close_position"
  | "close"
  | "global_cancel"
  | "force_retrain"
  | "force_review"
  | "sleep"
  | "wake"
  | "status"
  | "defensive"
  | "set_long_only"
  | "set_sessions"
  | "distill"
  | "refresh_calendar";

export interface CommandResult {
  ok: boolean;
  error?: string;
  action: BotCommand;
  result?: Record<string, any>;
}

// ── Map B live engine status (HUNTER telemetry /api/engine) ───────────────
// Projected verbatim from logs/engine_status.json. A missing/stale file
// reads as unknown (present:false), never as flat — see telemetry/state.py.

export interface EnginePosition {
  symbol: string;
  qty: number | null;
  entry: number;
  stop: number;
  target: number;
  hw: number;
  entry_time: number;
}

export interface EngineStatus {
  ts: number;
  pid: number;
  universe: string[] | null;
  universe_source: string | null;
  positions: EnginePosition[] | null;
  staged: string[];
  entries_today: Record<string, number>;
  entries_all: number;
  daily_pnl: number;
  vetoes: Record<string, number>;
  stages: number;
  last_action: {
    symbol: string;
    action: string;
    reason: string;
    ts: number;
  } | null;
  readable: boolean;
  present?: boolean;
  stale?: boolean;
  file_age_s?: number | null;
  served_at?: string;
}
