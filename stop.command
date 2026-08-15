#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
#  stop.command — HANOON 3.0 Web App (stop the dashboard only)
#
#  Usage: double-click, or  bash stop.command
#  Full system stop (bot + HALIM + webapp): use hanoon_rebuild/stop.command
# ═══════════════════════════════════════════════════════════════════════
set -uo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$ROOT/runtime/pids"

log() { echo -e "\033[1;36m[$(date '+%H:%M:%S')]\033[0m $*"; }
ok()   { echo -e "\033[32m[$(date '+%H:%M:%S')]\033[0m ✅ $*"; }

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🛑 HANOON 3.0 — Web Dashboard STOP"
echo "═══════════════════════════════════════════════════════════════"

_PID_FILE="$PID_DIR/hanoon_webapp.pid"
if [[ -f "$_PID_FILE" ]]; then
  PID=$(tr -d '[:space:]' < "$_PID_FILE" 2>/dev/null || echo "")
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    log "Stopping web dashboard (PID $PID)..."
    kill -TERM "$PID" 2>/dev/null || true
    local_waited=0
    while [[ $local_waited -lt 5 ]]; do
      if ! kill -0 "$PID" 2>/dev/null; then break; fi
      sleep 1
      local_waited=$((local_waited + 1))
    done
    if kill -0 "$PID" 2>/dev/null; then
      kill -9 "$PID" 2>/dev/null || true
    fi
  fi
  rm -f "$_PID_FILE"
fi

# Fallback: kill by pattern
pkill -f "next-server|next dev" 2>/dev/null || true

ok "Web dashboard stopped"
echo ""
echo "  Full system stop (bot + HALIM): hanoon_rebuild/stop.command"
echo ""
