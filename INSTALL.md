# RustAdmin Installation Guide

## Voraussetzungen

- Docker >= 20.10
- Docker Compose >= 2.0
- Steam API Key (kostenlos unter https://steamcommunity.com/dev/apikey)
- Optional: Discord Bot Token (https://discord.com/developers/applications)

---

## Schnellstart (empfohlen, Docker Compose)

1. **Repository klonen:**
   ```bash
   git clone https://github.com/DEIN_USERNAME/RustAdmin.git && cd RustAdmin
   ```

2. **Konfiguration:**
   ```bash
   cp .env.example .env
   ```
   Öffne `.env` mit einem Editor und trage mindestens `STEAM_API` ein.

3. **Starten:**
   ```bash
   docker compose up -d
   ```

4. **Browser öffnen:** http://localhost:8080

5. **Rust-Server hinzufügen:** IP, RCON-Port und RCON-Passwort in der Oberfläche eingeben.

---

## Manuelle Installation (ohne Docker)

**Voraussetzungen:** Node.js 18+, npm, laufender Redis-Server.

**Backend starten:**
```bash
cd user-data-srv
npm install
STEAM_API=DEIN_KEY CACHE_HOST=localhost CACHE_PORT=6379 npm run start:prod
```

**Frontend bauen und servieren:**
```bash
cd rustmon
npm install
npm run buildprod
# Den Inhalt von dist/rustmon in einen Webserver (nginx, Apache) legen oder:
npx serve dist/rustmon
```

---

## Rust-Server RCON konfigurieren

Füge folgendes in die `server.cfg` des Rust-Servers ein:
```
rcon.web 1
rcon.port 28016
rcon.password "DEIN_RCON_PASSWORT"
```

---

## Discord Bot einrichten (optional)

1. Öffne das [Discord Developer Portal](https://discord.com/developers/applications)
2. Erstelle eine neue Application, dann unter **Bot** einen Bot-Account.
3. Kopiere den Bot-Token und trage ihn als `DISCORD_BOT_TOKEN` in `.env` ein.
4. **Bot einladen:** Unter OAuth2 > URL Generator, Scopes: `bot`, Permissions: `Send Messages`, `Read Message History`, `Embed Links`.
5. **Kanal-IDs:** In Discord unter Einstellungen > Erweitert „Entwicklermodus" aktivieren, dann Rechtsklick auf Kanal > „ID kopieren".

**Bot-Befehle:**
- `!linksteam STEAM_ID` — Verknüpft den Discord-Account mit einem Steam-Account und fügt den Spieler zur konfigurierten Oxide-Gruppe hinzu.

---

## Häufige Probleme

**„Cannot connect to Redis"**
- Ursache: Redis läuft nicht oder `CACHE_HOST` ist falsch.
- Lösung: `docker compose ps` prüfen, Redis-Container muss „Up" zeigen.

**„RCON connection refused"**
- Ursache: `rcon.web` ist auf dem Rust-Server nicht aktiviert oder Port ist falsch.
- Lösung: `server.cfg` prüfen, Server neu starten, Firewall-Regeln prüfen (Port 28016 UDP und TCP).

**„Steam profile not loading"**
- Ursache: Steam API Key fehlt oder ist ungültig.
- Lösung: `STEAM_API` Umgebungsvariable prüfen, Key unter https://steamcommunity.com/dev/apikey generieren.

**Port 8080 already in use**
- Lösung: `RUSTADMIN_PORT=9090` in `.env` setzen.

---

## Update-Prozedur

```bash
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Umgebungsvariablen Referenz

| Variable | Standard | Beschreibung |
|---|---|---|
| `STEAM_API` | — | **Pflicht.** Steam Web API Key. |
| `RUSTADMIN_PORT` | `8080` | Host-Port für das Web-UI. |
| `CACHE_HOST` | `localhost` | Redis-Hostname. |
| `CACHE_PORT` | `6379` | Redis-Port. |
| `CACHE_AUTH` | — | Redis-Passwort (optional). |
| `CACHE_TTL` | `604800` | Cache-Lebensdauer in Sekunden. |
| `DISCORD_BOT_TOKEN` | — | Discord Bot Token (optional). |
| `DISCORD_CHANNEL_ID` | — | Discord Chat-Bridge Kanal-ID. |
| `DISCORD_STATUS_CHANNEL_ID` | — | Discord Status-Nachrichten Kanal-ID. |
| `DISCORD_OXIDE_GROUP` | `discord` | Oxide-Gruppe für verknüpfte Discord-Nutzer. |
| `VPN_CHECK_ENABLED` | `true` | VPN-Erkennung aktivieren. |
| `VPN_AUTO_KICK` | `false` | VPN-Spieler automatisch kicken. |
| `DATA_DIR` | `./data` | Verzeichnis für Blacklist/Scheduled-Commands JSON. |
