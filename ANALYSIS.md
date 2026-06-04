# RustMon — Pre-Implementation Analysis
**Datum:** 2026-06-04
**Basis:** NebelRebell/RustMon v2.1.0
**Referenz:** NinerAlpha/RustMon (RustPanel 3.0.0) — Clone fehlgeschlagen (Pfad-Mangling Windows/bash), Analyse basiert auf lokalem Repo

---

## Versionsbug: "new version 2.0.0 => 1.6.0"

- **Betroffene Datei:** `rustmon/src/app/api/user-data.service.ts` (Zeile 48) und `rustmon/src/app/dashboard/dashboard.component.ts` (Zeilen 59, 171-173)
- **Zeile:** `getLastVersion()` fetcht von `https://raw.githubusercontent.com/alexander171294/RustMon/master/version.txt` -- das ist ein *fremdes* Repo, nicht NebelRebell/RustMon
- **Ursache:** Die URL zeigt auf ein anderes GitHub-Konto. Das fremde `version.txt` enthaelt einen aelteren Stand (z.B. 1.6.0), waehrend das lokale `environment.version` = `2.1.0` ist. `latestVersion` wird initial auf `environment.version` gesetzt (Zeile 59), dann per HTTP ueberschrieben. Kein semver-Vergleich -- reine String-Ungleichheit triggert "new version"-Anzeige.
- **Geplanter Fix:** URL auf `https://raw.githubusercontent.com/NebelRebell/RustMon/master/version.txt` korrigieren; semver-Vergleichsfunktion (~10 Zeilen, kein Extra-Package noetig).

---

## Feature-Status

| #    | Feature                              | Status  | Aufwand |
|------|--------------------------------------|---------|---------|
| Bug0 | Versionsbug (falsches Repo + kein semver) | PARTIAL | 0.5h |
| Bug1 | Port konfigurierbar                  | SKIP    | 0h      |
| Bug2 | Plugin-Sortierung                    | SKIP    | 0h      |
| Bug3 | Service-Startup-Validierung          | SKIP    | 0h      |
| A    | Multi-User SaaS                      | MISSING | 20h+    |
| B    | OAuth (Discord/Google/Steam)         | MISSING | 8h      |
| C    | Landing Page                         | MISSING | 3h      |
| D    | Admin Dashboard                      | MISSING | 10h     |
| E    | Konsolenhistorie                     | SKIP    | 0h      |
| F    | Spielerposition auf Karte            | SKIP    | 0h      |
| G    | Discord-Bot                          | PARTIAL | 2h      |
| H    | Spieler-Blacklist                    | SKIP    | 0h      |
| I    | Geplante Befehle                     | PARTIAL | 2h      |
| J    | Item-Listen                          | MISSING | 3h      |
| K    | VPN-Erkennung                        | PARTIAL | 1h      |

---

## Detailanalyse

### Bug 0 -- Versionsbug
**Status:** PARTIAL
**Befund:**
- `rustmon/src/app/api/user-data.service.ts` Zeile 48: URL zeigt auf `alexander171294/RustMon` (fremdes Konto)
- `dashboard.component.ts` Zeile 59: `latestVersion = environment.version` (= `'2.1.0'`), dann Zeile 171-173: per HTTP auf Remote-Wert (z.B. `'1.6.0'`) gesetzt
- Kein semver-Package in `rustmon/package.json`

**Was fehlt:** Korrekter Repo-URL + semver-Vergleichsfunktion

---

### Bug 1 -- Port konfigurierbar
**Status:** SKIP (vollstaendig implementiert)
**Befund:**
- `environment.ts` Zeile 9: `apiPort: 8080` als Dev-Default
- `environment.prod.ts` Zeile 5: `apiPort: (window as any).__API_PORT__ || 8080` -- dynamisch, kein Hardcode im Prod-Build
- `environment.uDataApi` per `__BACKEND_URL__` oder localStorage-Override injizierbar

---

### Bug 2 -- Plugin-Sortierung
**Status:** SKIP (vollstaendig implementiert)
**Befund:**
- `umod.component.ts` Zeile 120-135: `sortPlugins(field)` unterscheidet numerische Felder (`valA - valB`) von Strings (`.localeCompare()`)
- Unit-Tests in `umod.component.spec.ts` Zeilen 32-67 decken beide Faelle ab

---

### Bug 3 -- Service-Startup-Validierung
**Status:** SKIP (vollstaendig implementiert)
**Befund:**
- `user-data-srv/src/main.ts` Zeile 5-25: `validateEnvironment()` prueft `STEAM_API` und `CACHE_HOST`/`CACHE_URL`, gibt strukturierte Fehlermeldung aus und ruft `process.exit(1)` auf
- Redis-Config vollstaendig aus Env-Vars mit sinnvollen Defaults

---

### Feature A -- Multi-User SaaS
**Status:** MISSING
**Befund:**
- Keine User-Entities, keine Auth-Guards, kein JWT-Modul in `user-data-srv/src/app.module.ts`
- `app-routing.module.ts`: nur `/login` (RCON-Credentials-Formular) und `/dashboard`
- `passport`, `@nestjs/jwt`, `@nestjs/passport` fehlen in `package.json`

**Was fehlt:** User-DB, JWT-Auth, Tenant-Isolation fuer alle Endpoints, Guard-Middleware -- vollstaendige Neuentwicklung

---

### Feature B -- OAuth (Discord/Google/Steam)
**Status:** MISSING
**Befund:**
- `user-data-srv/package.json`: kein `passport-discord`, `passport-google-oauth2`, `passport-steam`
- Kein Auth-Controller, keine `/auth/*`-Routes
- `discord.service.ts` implementiert Bot-Funktionalitaet, keinen OAuth-Flow

**Was fehlt:** OAuth-Provider-Packages, Callback-Controller, Session/Token-Handling; setzt Feature A voraus

---

### Feature C -- Landing Page
**Status:** MISSING
**Befund:**
- `app-routing.module.ts`: nur `/`, `/login`, `/dashboard` -- kein `/landing`
- Keine Landing-Komponente oder LandingModule vorhanden

**Was fehlt:** LandingModule + Komponente + Route

---

### Feature D -- Admin Dashboard
**Status:** MISSING
**Befund:**
- Kein `/admin`-Pfad, keine UserManagement-Komponente, kein Admin-Guard
- Setzt Features A+B voraus

---

### Feature E -- Konsolenhistorie
**Status:** SKIP (vollstaendig implementiert)
**Befund:**
- `dashboard.component.ts` Zeile 49-52: `commandHistory`, `historyIndex`, `HISTORY_KEY_PREFIX`, `HISTORY_MAX = 100`
- Zeile 204-226: `historyKey()`, `loadHistory()`, `saveHistory()`, `pushToHistory()` mit localStorage-Persistenz pro Connection-String
- Zeile 228-244: `consoleKeyDown()` mit ArrowUp/ArrowDown/Escape/Enter vollstaendig implementiert

---

### Feature F -- Spielerposition auf Karte
**Status:** SKIP (vollstaendig implementiert)
**Befund:**
- `map-overlay.component.ts`: vollstaendige Implementierung mit `interval(5000)` Polling
- `parsePlayers()` und `toPixel()` korrekt implementiert (Rust Z-Achsen-Inversion beachtet)
- `MapOverlayComponent` in `dashboard.module.ts` deklariert

---

### Feature G -- Discord-Bot
**Status:** PARTIAL
**Befund:**
- `discord.js: ^13.17.1` in package.json vorhanden
- `discord.service.ts`: Chat-Bridge, `!linksteam`-Command, Status-Embed-Updates implementiert

**Was fehlt:**
- `serverStatusProvider` und `rconSend` werden nirgends registriert -- beide bleiben `undefined`, Status-Updates und Chat-Bridge senden nie etwas
- discord.js v13 veraltet (aktuell v14); `MessageEmbed` -> `EmbedBuilder`, Intents-API geaendert

---

### Feature H -- Spieler-Blacklist
**Status:** SKIP (vollstaendig implementiert)
**Befund:**
- `user-data-srv/src/blacklist/`: alle vier Dateien (model, service, controller, module) vorhanden
- `BlacklistModule` in `app.module.ts` importiert
- Frontend-Komponente `PermsComponent` in `dashboard.module.ts` deklariert

---

### Feature I -- Geplante Befehle
**Status:** PARTIAL
**Befund:**
- `scheduled-commands/`: vollstaendiges Modul mit CRUD; nutzt `setInterval()` statt Cron
- `ScheduledCommandsModule` in `app.module.ts` importiert

**Was fehlt:**
- `rconExecutor` (Zeile 15 in `scheduled-commands.service.ts`) wird nie via `setRconExecutor()` registriert -- Zeile 69: Befehle nur geloggt, nicht ausgefuehrt
- Kein Frontend-Tab fuer Verwaltung
- `@nestjs/schedule` fehlt, keine Cron-Expression-Unterstuetzung

---

### Feature J -- Item-Listen
**Status:** MISSING
**Befund:**
- Kein localStorage fuer Item-Listen in `dashboard.component.ts`
- Keine ItemList-Komponente, kein ItemList-Endpunkt

**Was fehlt:** Frontend-Komponente, Persistenz, Item-Datenbasis

---

### Feature K -- VPN-Erkennung
**Status:** PARTIAL
**Befund:**
- `vpn.service.ts`: `checkIp(ip)` ruft `http://ip-api.com/json/${ip}?fields=proxy,hosting,query` auf (Zeile 30)
- `vpn.controller.ts` Zeile 8-10: `GET /player/:steamid/vpn-check` gibt nur Hinweistext zurueck (Stub)
- `GET /player/vpn-check/ip/:ip` (Zeile 13-16) delegiert korrekt an `vpnSvc.checkIp(ip)`

**Was fehlt:**
- `/player/:steamid/vpn-check?ip=x.x.x.x` ist Stub ohne echte Logik
- Kein Frontend-Badge in Spielerliste
- ip-api.com Rate-Limit (45 req/min); kein Redis-Caching obwohl `CacheRedisService` bereits vorhanden

---

## Gesamteinschätzung

### Realistisch in einem Durchgang

| Feature | Aufwand | Bemerkung |
|---------|---------|-----------|
| Bug0 -- Versionsbug | 0.5h | URL-Fix + 10-Zeilen semver |
| G -- Discord-Bot verdrahten | 2h | `setRconSender`/`setServerStatusProvider` in AppModule registrieren |
| I -- Scheduled Commands verdrahten | 2h | `setRconExecutor` + Frontend-Tab |
| K -- VPN Controller-Stub fixen | 1h | IP aus Query-Param + Redis-Cache nutzen |
| C -- Landing Page | 3h | Neue Komponente + Route |
| J -- Item-Listen | 3h | Frontend localStorage + UI |

### Zurueckstellen (Abhaengigkeitsketten / hoher Aufwand)

| Feature | Aufwand | Grund |
|---------|---------|-------|
| A -- Multi-User SaaS | 20h+ | Komplette Auth-Neuentwicklung |
| B -- OAuth | 8h | Setzt A voraus |
| D -- Admin Dashboard | 10h | Setzt A+B voraus |

### Abhaengigkeiten zwischen Features

A (Multi-User Auth) -> B (OAuth) -> D (Admin Dashboard)

G (Discord-Fix)     -- unabhaengig; discord.js v13->v14 Update einplanen
I (Scheduled-Fix)   -- unabhaengig; RCON-Proxy-Frage beachten (user-data-srv hat keinen WS-Kanal zum Rust-Server)
K (VPN-Fix)         -- unabhaengig; CacheRedisService bereits vorhanden
C (Landing Page)    -- unabhaengig
J (Item-Listen)     -- unabhaengig

### Offene Risiken

1. **discord.js v13 vs v14:** `MessageEmbed` -> `EmbedBuilder`, Intents-Flags-API geaendert; ~1h Extra-Aufwand bei Feature-G-Fix
2. **Scheduled Commands ohne RCON-Kanal:** `user-data-srv` hat keinen WebSocket-Kanal zum Rust-Server. `setRconExecutor`-Verdrahtung erfordert RCON-Proxy-Architektur oder HTTP-Callback-Ansatz
3. **ip-api.com Rate-Limits:** 45 req/min kostenlos; bei vielen Spielern silent failures; Fix: `CacheRedisService` fuer VPN-Results nutzen
