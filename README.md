> **Forked from [alexander171294/RustMon](https://github.com/alexander171294/RustMon) (Apache-2.0). Original Copyright 2022 alexander171294.**

# RustAdmin 2.0.0

A powerful, self-hosted web admin panel for Rust game servers. Manage your servers, players, plugins, and more — all from a clean browser interface.

---

## Features

### Core (from RustMon)
- Multi-server login and management
- Real-time dashboard: chat, players, console on one screen
- Plugin manager (enable / disable / reload, update checker)
- Permissions groups — export/import across multiple servers
- All server configurations in one panel
- Scheduled restart with countdown warning
- Player tools: auto-kick by ping, skip queue

### New in RustAdmin 2.0.0
- **Console command history** — navigate with ↑/↓ arrow keys, persisted per server
- **Player map overlay** — real-time player positions on the RustMaps map
- **Discord bot integration** — chat bridge, server status embeds, Steam account linking
- **Player Blacklist** — shared blacklist with auto-kick on join, import/export JSON
- **Scheduled commands** — define recurring RCON commands (cron-style intervals)
- **Savable item lists** — save "give item" presets in the browser
- **VPN detection** — flag or auto-kick VPN/proxy players via ip-api.com
- **ARM support** — multi-arch Docker images for amd64, arm64, arm/v7
- **Configurable port** — set `RUSTADMIN_PORT` via environment variable
- **Robust startup** — validates required env vars, Redis retry with exponential backoff

---

## Screenshots

| Login | Dashboard | Plugin Manager |
|---|---|---|
| ![Login](https://i.imgur.com/C6AolI6.png) | ![Dashboard](https://i.imgur.com/LBMmO1U.png) | ![Plugins](https://i.imgur.com/8qNMET3.png) |

| Player Details | Player Tools | Permissions |
|---|---|---|
| ![Players](https://i.imgur.com/8oUQXug.png) | ![Tools](https://i.imgur.com/nptYGlO.png) | ![Permissions](https://i.imgur.com/bo3G41h.png) |

---

## Quick Start

See [INSTALL.md](INSTALL.md) for the full installation guide.

```bash
git clone https://github.com/DEIN_USERNAME/RustAdmin.git && cd RustAdmin
cp .env.example .env
# Edit .env: set STEAM_API=your-key
docker compose up -d
# Open http://localhost:8080
```

---

## Configuration Reference

| Variable | Default | Description |
|---|---|---|
| `STEAM_API` | — | **Required.** Steam Web API Key. |
| `RUSTADMIN_PORT` | `8080` | Host port for the web UI. |
| `CACHE_HOST` | `localhost` | Redis hostname. |
| `CACHE_PORT` | `6379` | Redis port. |
| `CACHE_AUTH` | — | Redis password (optional). |
| `DISCORD_BOT_TOKEN` | — | Discord bot token (optional). |
| `DISCORD_CHANNEL_ID` | — | Chat bridge channel ID. |
| `DISCORD_STATUS_CHANNEL_ID` | — | Server status channel ID. |
| `VPN_CHECK_ENABLED` | `true` | Enable VPN detection. |
| `VPN_AUTO_KICK` | `false` | Auto-kick VPN players. |

See [INSTALL.md](INSTALL.md) for the complete list.

---

## Technology Stack

- **Frontend:** Angular 13, PrimeNG, SCSS
- **Backend:** NestJS (Node.js 18)
- **Cache:** Redis 7
- **Deployment:** Docker, Docker Compose (multi-arch: amd64, arm64, arm/v7)
- **External:** Steam API, ip-api.com (VPN detection), RustMaps API, Discord.js 14

---

## License

Apache-2.0 — see [LICENSE](LICENSE).

Forked from [RustMon by alexander171294](https://github.com/alexander171294/RustMon).
