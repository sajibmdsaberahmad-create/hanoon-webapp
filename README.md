# HANOON 3.0 Web App

Real-time trading dashboard for the [HANOON 3.0](https://github.com/Zaad1704/hanoon-tradingbot) rebuild.

## Architecture

Built with **Next.js 15 + React 19 + TypeScript + Tailwind CSS** (App Router).

### Layers Mirrored

| HANOON Layer | Web Component | Endpoint Source |
|---|---|---|
| **L0 Foundations** | `OverviewPanel` | `/telemetry` (system, component_status, vault) |
| **L1 Senses** | `PositionsPanel` | `/telemetry` (positions, tbt_rotation, brackets) |
| **L2 Brains** | `BrainPanel` | `/telemetry` (brain, nash, halim, learning, weights) |
| **L3 Execution** | `TradesPanel` | `/telemetry` (trades, brackets) |
| **L3 Risk** | Overview + Header | `/telemetry` (portfolio) |
| **L4 Reflection** | `ReflectionPanel` | `/telemetry` (supervisor, review) |
| **L5 Monitoring** | `SystemPanel` | `/telemetry` (watchdog, sleep, telemetry_hub) |
| **L6 Ops** | `ControlPanel` | `/command` (pause/resume/flatten) |

### API Proxy

The webapp proxies all requests to the HANOON bot's `TelemetryAPI` (port 8080) through `/api/bridge/[...path]/route.ts`. This avoids CORS issues and keeps the bridge URL server-side.

## Development

```bash
# 1. Start EVERYTHING (HALIM serve + bot + webapp)
cd /Users/mdsabersajib/Downloads/hanoon_rebuild
bash start.command

# 2. Check health
bash health.command

# 3. Stop EVERYTHING (bot + HALIM + webapp)
bash stop.command

# OR run webapp standalone for development
cd /Users/mdsabersajib/Downloads/hanoon_webapp
npm run dev
```

## Deployment

This app auto-deploys to Vercel when pushed to the `main` branch of
`https://github.com/Zaad1704/hanoon-webapp`.

### Configure on Vercel

Set the following Environment Variables (Project Settings → Environment Variables):

| Name | Value | Scope |
|---|---|---|
| `NEXT_PUBLIC_BRIDGE_URL` | `http://<your-bot-host>:8080` | Production |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | `5000` | Production |
| `HANOON_BOT_URL` | `http://<your-bot-host>:8080` | Production |

## HALIM Integration

- HALIM serve (Qwen3.5-4B MLX MoE) is started by `start.command` before the bot.
- The bot's `HalimBridge` (in-process) connects to HALIM serve as its external LM advisor.
- `stop.command` gracefully stops HALIM serve via the official `halim_stop.sh` (SIGTERM → SIGKILL for safe Metal GPU buffer release).
- HALIM trust and advisory are visible live in the **Brain Panel** under the "HALIM ADVISORY" section.

## Start/Stop Scripts

- **`start.command`** — Starts HALIM serve → HANOON bot → webapp dashboard
- **`stop.command`** — Stops webapp → bot (graceful shutdown) → HALIM serve
- **`health.command`** — Checks all 3 components are alive + responding

All PIDs are written to `runtime/pids/` in the bot root directory.
