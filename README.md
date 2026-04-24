# Smart Helmet Backend (IoT + Admin Dashboard)

This repository is a **TypeScript/Express + PostgreSQL/Prisma** backend for a Smart Helmet / Bike Safety IoT system.

It supports:
- **Admin dashboard APIs** (devices, pairing, contacts, telemetry, events, map, dashboard summary).
- **Device APIs** for ESP32/main unit (telemetry, events, heartbeat, location, config).
- **Public endpoints** that the ESP32 can poll without auth (contact, relay command, emergency, latest location).
- **Operational protections**: rate limiting, validation, centralized error handling, logging, OpenAPI docs.

It also includes **detection & alerting primitives**:
- **Last-hour data retention** (keep only 1 hour of telemetry + events per device).
- **Tariff-based alerts** (high load during high-rate hours).
- **Theft suspected alerts** (movement detected while relay is OFF).
- **Decaying anomaly score** (computed from last-hour events so it naturally goes down).
- **AI anomaly response normalization** (prevents “stuck anomaly” when payload fields conflict).

---

## Tech stack
- **Runtime**: Node.js \(>= 18\) + TypeScript
- **Framework**: Express.js
- **DB**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT (admin) + device auth (secret headers or device JWT)
- **Validation**: Zod
- **Logging**: Winston + Morgan
- **Docs**: Swagger/OpenAPI (served at `/docs`)

---

## Repository structure (what lives where)

```
src/
  app.ts                         Express app: security, cors, logging, routes, errors
  server.ts                      HTTP server + graceful shutdown
  config/
    env.ts                        All environment variables (typed)
    database.ts                   Prisma client singleton + connection helpers
    swagger.ts                    OpenAPI generation
  middleware/
    adminAuth.ts                  Admin JWT auth guard
    deviceAuth.ts                 Device auth guard (headers or device JWT)
    errorHandler.ts               Central error handler
    rateLimiter.ts                Global/device/auth rate limits
    normalizeAiAnomaly.ts         Response normalizer for AI anomaly payloads
    validate.ts                   Zod schema validation middleware
  routes/
    index.ts                      Mounts admin/device/public routes under `/api`
    admin/*                       Admin routes (dashboard/devices/telemetry/contacts/auth)
    device/*                       Device routes (telemetry/event/location/heartbeat/auth)
    public/*                       Public routes for device polling
  services/
    admin/*                       Admin business logic
    device/
      telemetry.service.ts        Persist telemetry/events + trigger detection hooks
      detection.service.ts        Retention pruning + tariff/theft detection + anomaly score
  controllers/                    Route handlers (thin; call services)
  validators/                     Zod request schemas
  utils/                          response helpers, JWT helpers, logger, crypto
prisma/
  schema.prisma                   Database schema
  seed.ts                         Seed script (admin + demo device)
public/
  dashboard.html                  Static admin dashboard page (if used)
```

---

## Quick start (local)

### Prerequisites
- Node.js \(>= 18\)
- PostgreSQL running locally (or use Docker)

### Install

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Minimum values you must set in `.env`:
- `DATABASE_URL`
- `JWT_SECRET`
- `DEVICE_TOKEN_SECRET`

### Run Prisma migrations

```bash
npm run prisma:migrate
```

### Optional seed (demo data)

```bash
npm run prisma:seed
```

### Run dev server

```bash
npm run dev
```

- API base: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/docs`
- Health: `http://localhost:3000/api/health`

---

## Scripts (what to run)

```bash
npm run dev         # dev server (ts-node-dev)
npm run typecheck   # TypeScript typecheck only
npm run lint        # ESLint
npm run build       # compile to dist/
npm run start       # run compiled server

npm run prisma:generate
npm run prisma:migrate
npm run prisma:migrate:prod
npm run prisma:seed
```

---

## Environment variables (complete list)

### Core
- `NODE_ENV` \(default: `development`\)
- `PORT` \(default: `3000`\)
- `API_PREFIX` \(default: `/api`\)
- `DATABASE_URL` **required**
- `CORS_ORIGINS` \(default: `http://localhost:3000`\) comma-separated

### Auth
- `JWT_SECRET` **required**
- `JWT_EXPIRES_IN` \(default: `7d`\)
- `JWT_REFRESH_EXPIRES_IN` \(default: `30d`\)
- `DEVICE_TOKEN_SECRET` **required**
- `DEVICE_TOKEN_EXPIRES_IN` \(default: `24h`\)

### Rate limiting
- `RATE_LIMIT_WINDOW_MS` \(default: `900000`\)
- `RATE_LIMIT_MAX` \(default: `100`\)
- `DEVICE_RATE_LIMIT_MAX` \(default: `500`\)

### Retention & detection
- `DATA_RETENTION_WINDOW_MS` \(default: `3600000` = 1 hour\)

### Tariff-based alerting
- `TARIFF_HIGH_RATE_START_HOUR` \(default: `18`\) — local server hour (24h)
- `TARIFF_HIGH_RATE_END_HOUR` \(default: `6`\) — supports wrap across midnight
- `HIGH_LOAD_WATTS_THRESHOLD` \(default: `1500`\)

### Theft detection (last-hour telemetry)
- `THEFT_SPEED_KMPH_THRESHOLD` \(default: `8`\)
- `THEFT_MIN_SAMPLES` \(default: `3`\)

### AI anomaly response normalization
- `ANOMALY_SCORE_THRESHOLD` \(default: `50`\) — 0–100 scale

### Logging
- `LOG_LEVEL` \(default: `info`\)
- `LOG_DIR` \(default: `logs`\)

---

## Auth model (how requests are authenticated)

### Admin
- `Authorization: Bearer <admin_jwt>`
- Used on `/api/admin/**`

### Device
Supported patterns:
- **Headers**: `x-device-id` + `x-device-secret`
- **Device JWT**: obtained from `POST /api/device/auth`, then `Authorization: Bearer <device_jwt>`

Device requests are rate-limited and validated.

---

## API overview (what endpoints exist)

Base URL (local): `http://localhost:3000/api`

### Health
- `GET /health`

### Admin: Auth
- `POST /admin/auth/login`
- `GET /admin/auth/me`

### Admin: Devices
- `POST /admin/devices/main`
- `GET /admin/devices/main`
- `GET /admin/devices/main/:id`
- `PATCH /admin/devices/main/:id`
- `POST /admin/devices/main/:id/rotate-secret`
- `PATCH /admin/devices/main/:id/config`
- `POST /admin/devices/helmet`
- `GET /admin/devices/helmet`
- `POST /admin/devices/pair`
- `DELETE /admin/devices/pair/:pairingId`

### Admin: Contacts
- `POST /admin/contacts`
- `GET /admin/contacts/device/:deviceId`
- `GET /admin/contacts/:id`
- `PATCH /admin/contacts/:id`
- `DELETE /admin/contacts/:id`

### Admin: Telemetry & Events
- `GET /admin/telemetry`
- `GET /admin/telemetry/device/:deviceId/latest`
- `GET /admin/telemetry/events`

Query parameters supported by list endpoints:
- `page`, `limit`, `device_id`, `from`, `to`, `event_type`

### Admin: Dashboard
- `GET /admin/dashboard/summary`
- `GET /admin/dashboard/device-statuses`
- `GET /admin/dashboard/map`

### Device (ESP32 / main unit)
- `POST /device/auth`
- `GET /device/config/:deviceId`
- `GET /device/:deviceId/contact`
- `POST /device/telemetry`
- `POST /device/event`
- `POST /device/location`
- `POST /device/heartbeat`

### Public (no auth; for device polling)
- `GET /public/contact/:deviceId`  — get primary contact
- `GET /public/location/:deviceId` — get latest location
- `GET /public/relay/:deviceId`    — get relay command
- `POST /public/emergency/:deviceId` — record emergency button press
- `GET /public/emergency/:deviceId`  — get latest emergency event

---

## Dashboard functions (what each dashboard endpoint returns)

### `GET /api/admin/dashboard/summary`
Returns a compact page payload:
- **stats**:
  - `total_devices`
  - `active_devices`
  - `online_devices`
  - `offline_devices`
  - `total_emergency_contacts`
  - `total_telemetry_records`
  - `critical_events_24h`
- **recent_events**: latest 10 events across devices
- **latest_telemetry**: last telemetry record per device (up to 5 devices in response)

Online/offline is computed using:
- `ONLINE_THRESHOLD_SECONDS` (currently `90` seconds)
- `main_devices.last_seen`

### `GET /api/admin/dashboard/device-statuses`
Returns one entry per ACTIVE device with:
- device identity info
- pairing info
- `is_online`
- `latest_state` (last telemetry fields)
- `anomaly_score` (0–100, computed from last hour events with time decay)

### `GET /api/admin/dashboard/map`
Returns map-ready device locations using last valid GPS telemetry record per device.

---

## Detection & AI functions (how it works)

### 1) Last-hour retention (DB storage behavior)
On every `POST /api/device/telemetry`, after inserting the new telemetry:
- the service deletes telemetry **older than `DATA_RETENTION_WINDOW_MS`** for that device
- it deletes events **older than `DATA_RETENTION_WINDOW_MS`** for that device

Implementation: `src/services/device/detection.service.ts` → `pruneOldDeviceData()`

This keeps the DB small and guarantees any “last hour” logic is bounded.

### 2) Tariff-based alerting (high-rate + high load)
Trigger condition:
- current server time is inside the **high-rate window**
  - `TARIFF_HIGH_RATE_START_HOUR` .. `TARIFF_HIGH_RATE_END_HOUR` (wrap around midnight supported)
- incoming telemetry contains a load/power watts value in `raw_payload`
- `watts >= HIGH_LOAD_WATTS_THRESHOLD`

When triggered, it creates a `DeviceEvent`:
- `event_type = tariff_high_rate_load`
- `severity = WARNING`
- `event_message` recommends avoiding heavy loads during peak hours

To avoid spamming, it de-dupes to **at most 1 event per 10 minutes** per device.

Watts extraction is flexible to support multiple firmware payload keys:
- `raw_payload.load_watts`
- `raw_payload.load_w`
- `raw_payload.power_watts`
- `raw_payload.power_w`
- `raw_payload.watts`

### 3) Theft suspected (last-hour telemetry)
Trigger condition in last hour telemetry:
- `gps_valid = true`
- `relay_state = false` (relay/engine off)
- `speed_kmph > THEFT_SPEED_KMPH_THRESHOLD`
- at least `THEFT_MIN_SAMPLES` samples satisfy this

When triggered, it creates:
- `event_type = theft_suspected`
- `severity = CRITICAL`

Also de-duped to avoid spam (max once per 10 minutes).

### 4) Decaying anomaly score (goes down naturally)
The endpoint `GET /api/admin/dashboard/device-statuses` includes:
- `anomaly_score` (0–100)

How it’s computed:
- fetch last hour events for the device
- each event contributes a base weight by severity:
  - `INFO` < `WARNING` < `CRITICAL`
- contribution decays over time using an exponential decay

This means:
- score increases when recent WARN/CRITICAL events happen
- score decreases automatically as events age out (and because old events are pruned)

### 5) AI anomaly response normalization (prevents “stuck anomaly”)
Some clients/models produce inconsistent payloads like:
- `ai_result.status = "normal"` but `suggestion.status = "anomaly"`

That can cause frontends to permanently show “anomaly”.

Middleware: `src/middleware/normalizeAiAnomaly.ts`
- intercepts JSON responses under `/api`
- if it sees `data.ai_result` / `data.suggestion` / `data.theft_score`, it:
  - computes a **single** `data.final`:
    - `final.anomaly_score` = max of AI score, suggestion score, theft score (scaled to 0–100)
    - `final.status` = `"anomaly"` only if `final.anomaly_score >= ANOMALY_SCORE_THRESHOLD`
  - when `final.status` is normal, it forces:
    - `suggestion.status = "normal"`
    - action item scores to `0`

This makes the API response internally consistent and prevents “anomaly not going down”.

---

## Event types (device events)

Core:
- `heartbeat`
- `helmet_status_changed`
- `relay_on` / `relay_off`
- `emergency_button` / `emergency_sms_sent`
- `low_battery_main` / `low_battery_helmet`
- `accident_suspected` / `accident_confirmed`
- `gps_fix_lost` / `gps_fix_restored`

Detection-generated:
- `tariff_high_rate_load`
- `theft_suspected`

Severity mapping lives in `src/types/index.ts`.

---

## Project flow (end-to-end)

### Device → Backend (telemetry loop)
1. Device authenticates (optional) via `/api/device/auth`
2. Device sends periodic telemetry to `/api/device/telemetry`
3. Backend stores telemetry and updates `main_devices.last_seen`
4. Backend prunes old device data (keeps last hour only)
5. Backend triggers detection:
   - tariff_high_rate_load events
   - theft_suspected events
6. Admin dashboard reads telemetry/events and shows:
   - online/offline status
   - latest telemetry snapshot
   - map locations
   - recent events
   - anomaly_score (decays)

### Admin → Backend (dashboard loop)
1. Admin logs in via `/api/admin/auth/login`
2. Admin uses dashboard endpoints to display device state and events

---

## Production deployment notes (important)

### 1) Prisma enum update for new event types
If your production DB already exists, PostgreSQL needs the new enum values added.

Run once on the production DB:

```sql
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'tariff_high_rate_load';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'theft_suspected';
```

Then deploy the updated backend.

### 2) Build & run
Typical production steps:

```bash
npm ci
npm run prisma:generate
npm run build
npm run prisma:migrate:prod
node dist/server.js
```

### 3) Required production env vars
At minimum:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
DEVICE_TOKEN_SECRET=...
CORS_ORIGINS=https://yourdomain.com
```

---

## Troubleshooting (common)

### “Device is offline” but it’s sending data
- Online is based on `main_devices.last_seen` vs `ONLINE_THRESHOLD_SECONDS` (90s).
- Ensure device routes are calling telemetry/heartbeat and that requests pass auth.

### “Anomaly detected” never goes down
- Use the `final` object in API responses if present.
- Ensure `ANOMALY_SCORE_THRESHOLD` is reasonable.
- If a frontend uses multiple fields (`ai_result.status` and `suggestion.status`), it can get stuck; this repo includes a normalizer to fix that.

### Prisma migrate fails locally
- Ensure your local `DATABASE_URL` user has permissions (create/alter tables, etc.).

---

## Security notes
- Never commit `.env`
- Rotate device secrets after provisioning
- Use HTTPS in production
- Protect DB access (device secrets exist in DB)

