# RustMon (Nebelbank Edition)

A powerful, self-hosted admin panel for Rust game servers. Manage players, plugins, wipes, console, and more — all from one modern web interface.

> **Forked from** [alexander171294/RustMon](https://github.com/alexander171294/RustMon) (Apache-2.0) and [NinerAlpha/RustMon](https://github.com/NinerAlpha/RustMon).  
> Extended by [NebelRebell](https://github.com/NebelRebell) with multi-user auth, OAuth, VPN detection, Discord bot, and more.

---

## Features

| Feature | v1.x | v2.0 | v2.1 | v3.0 |
|---|---|---|---|---|
| RCON WebSocket connection | ✓ | ✓ | ✓ | ✓ |
| Live chat & player list | ✓ | ✓ | ✓ | ✓ |
| Console with history | | ✓ | ✓ | ✓ |
| Map Overlay | | ✓ | ✓ | ✓ |
| Player Blacklist | | ✓ | ✓ | ✓ |
| Pterodactyl integration | | | ✓ | ✓ |
| Plugin Manager (SFTP) | | | ✓ | ✓ |
| ConVars Manager | | | ✓ | ✓ |
| Wipe Manager | | | ✓ | ✓ |
| Multi-user platform + JWT | | | | ✓ |
| OAuth (Discord/Steam/Google) | | | | ✓ |
| Landing page | | | | ✓ |
| Admin dashboard (user mgmt) | | | | ✓ |
| Discord bot + chat bridge | | | | ✓ |
| Scheduled commands | | | | ✓ |
| Item give lists | | | | ✓ |
| VPN detection (ip-api.com) | | | | ✓ |
| Multi-arch Docker (arm64/v7) | | | | ✓ |

---

## Quick Start

See [INSTALL.md](INSTALL.md) for full setup instructions.

```bash
cp .env.example .env
# Edit .env with your values
docker compose up -d
```

Frontend: http://localhost:8080  
Backend API: http://localhost:3000

Default admin: `admin@rustmon.local` / `change-me-now` (change via `ADMIN_EMAIL`/`ADMIN_PASSWORD`)

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `RUSTADMIN_PORT` | `8080` | Frontend port |
| `REDIS_PASSWORD` | _(empty)_ | Redis auth password |
| `CACHE_TTL` | `604800` | Cache TTL in seconds |
| `STEAM_API` | | Steam Web API key |
| `JWT_SECRET` | `rustmon-dev-secret-...` | JWT signing secret — **change in production** |
| `ADMIN_EMAIL` | `admin@rustmon.local` | Default admin email |
| `ADMIN_PASSWORD` | `change-me-now` | Default admin password |
| `DISCORD_BOT_TOKEN` | | Discord bot token |
| `DISCORD_CHANNEL_ID` | | Channel for Rust↔Discord chat |
| `DISCORD_STATUS_CHANNEL_ID` | | Channel for server status embeds |
| `DISCORD_OXIDE_GROUP` | `discord` | Oxide group for !linksteam |
| `DISCORD_CLIENT_ID` | | Discord OAuth2 client ID |
| `DISCORD_CLIENT_SECRET` | | Discord OAuth2 client secret |
| `GOOGLE_CLIENT_ID` | | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | | Google OAuth2 client secret |
| `FRONTEND_URL` | `http://localhost:8080` | Public frontend URL (OAuth redirects) |
| `API_URL` | `http://localhost:3000` | Public backend URL (OAuth callbacks) |
| `VPN_CHECK_ENABLED` | `true` | Enable VPN detection via ip-api.com |
| `VPN_AUTO_KICK` | `false` | Auto-kick VPN players |

---

## Architecture

- **Frontend**: Angular 13 + PrimeNG 13, served via Nginx
- **Backend**: NestJS 8 + Node 18, Redis for caching and state
- **Database**: Redis (no SQL required)
- **Auth**: JWT (7-day tokens) + optional OAuth via Discord/Steam/Google

---

## License

Apache-2.0 — see [LICENSE](LICENSE).
