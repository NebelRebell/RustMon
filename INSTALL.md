# RustMon Installation Guide

## Prerequisites

- Docker & Docker Compose (recommended)
- **Or** manually: Node.js 18+, Redis 6+

---

## Quick Start (Docker Compose)

```bash
git clone https://github.com/NebelRebell/RustMon.git
cd RustMon/RustAdmin
cp .env.example .env
# Edit .env — at minimum set STEAM_API and JWT_SECRET
docker compose up -d
```

Open http://localhost:8080 — login with `admin@rustmon.local` / `change-me-now`.

**Change the admin password immediately** via Admin Dashboard or set `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env` before first start.

---

## Manual Installation

### Backend (user-data-srv)

```bash
cd user-data-srv
npm install
# Set environment variables (see .env.example)
npm run build
npm run start:prod
```

### Frontend (rustmon)

```bash
cd rustmon
npm install
npm run build -- --configuration production
# Serve the dist/ folder with any static web server (nginx recommended)
```

---

## RCON Configuration

In your Rust server's `server.cfg` (or startup args):

```
+rcon.port 28016
+rcon.password "your-rcon-password"
+rcon.web 1
```

In the RustMon login screen, enter:
- **Server IP**: your server's public IP
- **RCON Port**: 28016 (or your custom port)
- **RCON Password**: as set above

---

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) → New Application
2. Bot → Add Bot → copy **Bot Token** → set `DISCORD_BOT_TOKEN` in `.env`
3. Enable **Message Content Intent** under Privileged Gateway Intents
4. Invite the bot to your server with `bot` + `applications.commands` scopes
5. Copy the channel IDs for chat bridge and status updates

---

## OAuth Setup

### Discord OAuth2

1. Discord Developer Portal → your app → OAuth2 → Redirects
2. Add: `http://your-api-url/auth/discord/callback`
3. Copy **Client ID** and **Client Secret** → set `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`

### Google OAuth2

1. [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth 2.0 Client
2. Authorized redirect URI: `http://your-api-url/auth/google/callback`
3. Copy **Client ID** and **Client Secret** → set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### Steam OpenID

No credentials needed — Steam OpenID uses your `API_URL` for the callback.  
Set `API_URL` to your backend's public URL.

---

## Setting JWT Secret

**Always change the JWT secret in production:**

```bash
# Generate a strong secret
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Set in .env:
JWT_SECRET=<generated-value>
```

---

## Common Problems

| Problem | Solution |
|---|---|
| Cannot connect to RCON | Check `rcon.web 1` is set, firewall allows the RCON port |
| Redis connection refused | Ensure Redis is running; check `CACHE_HOST`/`CACHE_PORT` |
| OAuth redirect mismatch | Ensure `FRONTEND_URL`/`API_URL` match the OAuth app settings |
| Discord bot not responding | Check bot has Message Content Intent enabled |
| Default admin not created | Redis must be reachable on first start |
| VPN check not working | ip-api.com rate-limits free tier to 45 req/min |

---

## Updating

```bash
git pull origin master
cd rustmon && npm install
cd ../user-data-srv && npm install
docker compose build --no-cache
docker compose up -d
```
