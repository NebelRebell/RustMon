> **Forked from [alexander171294/RustMon](https://github.com/alexander171294/RustMon) (Apache-2.0). Original Copyright 2022 alexander171294.**

# RustMon 2.1.0

A powerful, self-hosted web admin panel for Rust game servers. Manage your servers, players, plugins, and more — all from a clean browser interface.

---

## What's New in 2.1.0

### Pterodactyl Panel Integration
- **Pterodactyl Config** — Connect RustMon to your Pterodactyl panel via API key + SFTP credentials. Test the connection live from the dashboard. Settings are stored securely in Redis with encrypted sensitive fields.
- **Advanced Plugin Manager** — Browse all installed Oxide/Carbon plugins via SFTP, upload new `.cs` files, toggle plugins on/off (`oxide.load` / `oxide.unload`), update to the latest uMod version in one click, and delete plugins. Automatically detects whether your server runs Oxide (`/oxide/plugins`) or Carbon (`/carbon/plugins`).
- **ConVars Manager** — View and edit 14 common Rust server configuration variables (max players, gather rate, decay, etc.) directly from the dashboard. Filter by category or search by name. Values are type-validated before saving.
- **Wipe Manager** — Configure automated wipe schedules (weekly, bi-weekly, monthly, or First Thursday / official wipe day). Set map size, random or custom seed, and optional post-wipe startup commands. Execute an immediate wipe via RCON at any time.

### Fixes & Improvements
- GitHub links corrected to [NebelRebell/RustMon](https://github.com/NebelRebell/RustMon)
- Version display in dashboard footer now shows `2.1.0`

---

## Features

### Core (from RustMon 1.x)
- Multi-server login and management
- Real-time dashboard: chat, players, console on one screen
- Permissions groups — export/import across multiple servers
- All server configurations in one panel
- Scheduled restart with countdown warning
- Player tools: auto-kick by ping, skip queue

### Added in 2.0.0
- **Console command history** — navigate with arrow keys, persisted per server
- **Player map overlay** — real-time player positions on the RustMaps map
- **Discord bot integration** — chat bridge, server status embeds, Steam account linking
- **Player Blacklist** — shared blacklist with auto-kick on join, import/export JSON
- **Scheduled commands** — define recurring RCON commands (cron-style intervals)
- **Savable item lists** — save "give item" presets in the browser
- **VPN detection** — flag or auto-kick VPN/proxy players via ip-api.com
- **ARM support** — multi-arch Docker images for amd64, arm64, arm/v7
- **Configurable port** — set RUSTADMIN_PORT via environment variable
- **Robust startup** — validates required env vars, Redis retry with exponential backoff

### Added in 2.1.0
- **Pterodactyl Config panel** — API key, panel URL, server ID, SFTP host/port/credentials, live connection test
- **Advanced Plugin Manager** — SFTP-based plugin management with uMod update checking, Oxide/Carbon auto-detection
- **ConVars Manager** — Edit server variables with type validation directly from the UI
- **Wipe Manager** — Scheduled and on-demand wipes with map size, seed control, and startup command queue

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
git clone https://github.com/NebelRebell/RustMon.git && cd RustMon/RustAdmin
cp .env.example .env
# Edit .env: set STEAM_API=your-key
docker compose up -d
# Open http://localhost:8080
```

---

## Pterodactyl Setup (2.1.0)

To use the Plugin Manager, ConVars Manager, and Wipe Manager:

1. Open the dashboard and click the **wrench icon** (Pterodactyl Config) in the top-right action bar.
2. Enter your Pterodactyl panel URL, API key (Client API key, starts with `ptlc_`), Server ID, and SFTP credentials.
3. Click **Test Connection** — a green toast confirms the panel and SFTP are reachable.
4. Click **Save**. The configuration is stored in Redis (TTL 24 hours).

Once connected, the **Plugin Manager** and **ConVars Manager** buttons appear in the nav bar (requires `user-data-srv` to be running and connected).

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

- **Frontend:** Angular 13, PrimeNG 13, SCSS, FontAwesome
- **Backend:** NestJS (Node.js 18), ssh2-sftp-client
- **Cache:** Redis 7
- **Deployment:** Docker, Docker Compose (multi-arch: amd64, arm64, arm/v7)
- **External:** Steam API, ip-api.com (VPN detection), RustMaps API, Discord.js, uMod.org (plugin updates)

---

## Changelog

### 2.1.0
- Pterodactyl Panel integration (Plugin Manager, ConVars Manager, Wipe Manager, Config panel)
- GitHub links corrected to NebelRebell/RustMon
- Backend: ssh2-sftp-client dependency added

### 2.0.0
- Console command history
- Player map overlay
- Discord bot integration
- Player Blacklist
- Scheduled commands
- VPN detection
- ARM Docker support

### 1.x
- Initial fork from [alexander171294/RustMon](https://github.com/alexander171294/RustMon)

---

## License

Apache-2.0 — see [LICENSE](LICENSE).

Forked from [RustMon by alexander171294](https://github.com/alexander171294/RustMon).
