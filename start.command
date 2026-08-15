#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
#  start.command — HANOON 3.0 Web App (standalone webapp mode)
#
#  Starts ONLY the web dashboard (for development/testing).
#  To start the bot + HALIM too, use the start.command in hanoon_rebuild/.
#
#  Usage: double-click, or  bash start.command
# ═══════════════════════════════════════════════════════════════════════
set -uo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT" || exit 1

PID_DIR="$ROOT/runtime/pids"
LOG_DIR="$ROOT/logs"
mkdir -p "$PID_DIR" "$LOG_DIR"

log() { echo -e "\033[1;36m[$(date '+%H:%M:%S')]\033[0m $*"; }
ok()   { echo -e "\033[32m[$(date '+%H:%M:%S')]\033[0m ✅ $*"; }

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 HANOON 3.0 — Web Dashboard START"
echo "═══════════════════════════════════════════════════════════════"

_PID_FILE="$PID_DIR/hanoon_webapp.pid"

# Check if already running
if [[ -f "$_PID_FILE" ]]; then
  PID=$(cat "$_PID_FILE" 2>/dev/null || echo "")
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    log "Web dashboard already running (PID $PID)"
    ok "Dashboard: http://127.0.0.1:3000"
    exit 0
  fi
  rm -f "$_PID_FILE"
fi

# Install deps if needed
if [[ ! -d "node_modules" ]]; then
  log "Installing npm dependencies..."
  npm install > "$LOG_DIR/webapp_npm.log" 2>&1
fi

# Start the dev server
nohup npm run dev -- --port 3000 > "$LOG_DIR/webapp.log" 2>&1 &
WEB_PID=$!
echo "$WEB_PID" > "$_PID_FILE"

sleep 2
if curl -sf "http://127.0.0.1:3000" >/dev/null 2>&1; then
  ok "Web dashboard started (PID $WEB_PID)"
  ok "Dashboard: http://127.0.0.1:3000"
else
  log "Dashboard starting... (may take a few more seconds)"
  log "  Log: tail -f $LOG_DIR/webapp.log"
fi

# If the bot is running, the dashboard will auto-connect to its TelemetryAPI
if curl -sf "http://127.0.0.1:8080/health" >/dev/null 2>&1; then
  ok "Connected to HANOON bot TelemetryAPI on :8080"
else
  log "Bot TelemetryAPI not running — start the bot first:"
  log "  cd /Users/mdsabersajib/Downloads/hanoon_rebuild && bash start.command"
fi

echo ""
echo "  Stop: ./stop.command"
echo ""
