# Smart Helmet IoT Backend

Production-grade REST API backend for the Smart Helmet + Bike Safety IoT system.

## Stack
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5
- **Auth**: JWT (admin) + device key auth
- **Validation**: Zod
- **Logging**: Winston + Morgan
- **Docs**: Swagger/OpenAPI 3.0
- **Docker**: App + PostgreSQL compose

---

## Project Structure

```
smart-helmet-backend/
├── src/
│   ├── app.ts                    # Express app setup
│   ├── server.ts                 # HTTP server + graceful shutdown
│   ├── config/
│   │   ├── env.ts                # Typed env variables
│   │   ├── database.ts           # Prisma client singleton
│   │   └── swagger.ts            # OpenAPI spec config
│   ├── middleware/
│   │   ├── adminAuth.ts          # JWT admin auth guard
│   │   ├── deviceAuth.ts         # Device header/token auth guard
│   │   ├── errorHandler.ts       # Central error handler + AppError
│   │   ├── rateLimiter.ts        # Global / device / auth rate limits
│   │   └── validate.ts           # Zod schema validation middleware
│   ├── controllers/
│   │   ├── admin/                # Admin panel controllers
│   │   └── device/               # ESP32 device controllers
│   ├── services/
│   │   ├── admin/                # Admin business logic
│   │   └── device/               # Device business logic
│   ├── routes/
│   │   ├── admin/                # Admin route definitions
│   │   ├── device/               # Device route definitions
│   │   └── index.ts              # Root router
│   ├── validators/
│   │   ├── admin.validator.ts    # Admin Zod schemas
│   │   └── device.validator.ts   # Device Zod schemas
│   ├── utils/
│   │   ├── logger.ts             # Winston logger
│   │   ├── response.ts           # Consistent JSON response helpers
│   │   ├── jwt.ts                # Sign/verify admin + device tokens
│   │   └── crypto.ts             # Bcrypt + secret key utilities
│   └── types/
│       └── index.ts              # Shared TypeScript types
├── prisma/
│   ├── schema.prisma             # Full Prisma schema
│   └── seed.ts                   # Demo data seeder
├── docs/
│   └── postman_collection.json   # Import into Postman
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## Quick Start (Local)

### 1. Prerequisites
- Node.js 20+
- PostgreSQL 16 running locally, OR use Docker Compose

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment
```bash
cp .env.example .env
# Edit .env — update DATABASE_URL, JWT_SECRET, DEVICE_TOKEN_SECRET
```

### 4. Start database with Docker (optional)
```bash
docker compose up postgres -d
```

### 5. Run migrations
```bash
npm run prisma:migrate
# For production:
# npm run prisma:migrate:prod
```

### 6. Seed demo data
```bash
npm run prisma:seed
```

### 7. Start development server
```bash
npm run dev
```

Server starts at: `http://localhost:3000`  
Swagger docs: `http://localhost:3000/docs`

---

## Docker (Full Stack)

```bash
# Build and run app + postgres
docker compose up --build

# Run migrations inside container
docker compose exec app npx prisma migrate deploy

# Seed
docker compose exec app npx ts-node prisma/seed.ts
```

---

## Default Credentials (after seed)

| Item | Value |
|------|-------|
| Admin email | `admin@smarthelmet.local` |
| Admin password | `Admin@12345` |
| Device ID | `MAIN-DEMO-001` |
| Device secret | `demo_secret_key_change_in_production_32chars` |

---

## API Reference

Base URL: `http://localhost:3000/api`

### Authentication

**Admin:** `Authorization: Bearer <jwt_token>`  
**Device (option A):** `x-device-id: MAIN-001` + `x-device-secret: <secret>`  
**Device (option B):** `Authorization: Bearer <device_jwt>` (after `/device/auth`)

---

### Health
```
GET /api/health
```

---

### Admin Auth
```
POST /api/admin/auth/login        Login and get JWT
GET  /api/admin/auth/me           Get current admin profile
```

---

### Admin — Devices
```
POST   /api/admin/devices/main              Register main device
GET    /api/admin/devices/main              List all main devices (?page=1&limit=20)
GET    /api/admin/devices/main/:id          Get main device + pairing + config
PATCH  /api/admin/devices/main/:id          Update main device
POST   /api/admin/devices/main/:id/rotate-secret  Rotate device secret key
PATCH  /api/admin/devices/main/:id/config   Update device configuration

POST   /api/admin/devices/helmet            Register helmet device
GET    /api/admin/devices/helmet            List helmet devices

POST   /api/admin/devices/pair              Pair main + helmet device
DELETE /api/admin/devices/pair/:pairingId   Unpair devices
```

---

### Admin — Contacts
```
POST   /api/admin/contacts                       Create emergency contact
GET    /api/admin/contacts/device/:deviceId      List contacts for device
GET    /api/admin/contacts/:id                   Get contact
PATCH  /api/admin/contacts/:id                   Update contact
DELETE /api/admin/contacts/:id                   Delete contact
```

---

### Admin — Dashboard
```
GET /api/admin/dashboard/summary         Stats: devices, events, telemetry counts
GET /api/admin/dashboard/device-statuses Online/offline + latest state per device
GET /api/admin/dashboard/map             GPS locations (map-ready format)
```

---

### Admin — Telemetry & Events
```
GET /api/admin/telemetry                         List telemetry (paginated)
GET /api/admin/telemetry/device/:deviceId/latest Latest telemetry record
GET /api/admin/telemetry/events                  List events (paginated)

Query params: page, limit, device_id, from, to, event_type
```

---

### Device APIs (ESP32)
```
POST /api/device/auth                     Authenticate → receive JWT
GET  /api/device/config/:deviceId         Fetch device config
GET  /api/device/:deviceId/contact        Fetch primary emergency contact (SMS use)
POST /api/device/telemetry                Submit full telemetry
POST /api/device/event                    Submit discrete event
POST /api/device/location                 Submit GPS location
POST /api/device/heartbeat                Send lightweight heartbeat
```

---

## Sample curl Requests

### Admin login
```bash
curl -s -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smarthelmet.local","password":"Admin@12345"}'
```

### Device authentication
```bash
curl -s -X POST http://localhost:3000/api/device/auth \
  -H "Content-Type: application/json" \
  -d '{"device_id":"MAIN-DEMO-001","secret_key":"demo_secret_key_change_in_production_32chars"}'
```

### Fetch emergency contact (from ESP32)
```bash
curl -s http://localhost:3000/api/device/MAIN-DEMO-001/contact \
  -H "x-device-id: MAIN-DEMO-001" \
  -H "x-device-secret: demo_secret_key_change_in_production_32chars"
```

### Submit telemetry (from ESP32)
```bash
curl -s -X POST http://localhost:3000/api/device/telemetry \
  -H "Content-Type: application/json" \
  -H "x-device-id: MAIN-DEMO-001" \
  -H "x-device-secret: demo_secret_key_change_in_production_32chars" \
  -d '{
    "helmet_id": "HELM-DEMO-001",
    "helmet_worn": true,
    "relay_state": true,
    "helmet_battery_percent": 87,
    "main_battery_percent": 73,
    "latitude": 31.5204,
    "longitude": 74.3587,
    "speed_kmph": 35.2,
    "gps_valid": true,
    "signal_strength": -73,
    "event_type": "heartbeat"
  }'
```

### Submit emergency button event
```bash
curl -s -X POST http://localhost:3000/api/device/event \
  -H "Content-Type: application/json" \
  -H "x-device-id: MAIN-DEMO-001" \
  -H "x-device-secret: demo_secret_key_change_in_production_32chars" \
  -d '{
    "event_type": "emergency_button",
    "event_message": "SOS button pressed",
    "metadata": {"lat": 31.5204, "lng": 74.3587}
  }'
```

### Submit heartbeat
```bash
curl -s -X POST http://localhost:3000/api/device/heartbeat \
  -H "Content-Type: application/json" \
  -H "x-device-id: MAIN-DEMO-001" \
  -H "x-device-secret: demo_secret_key_change_in_production_32chars" \
  -d '{
    "helmet_worn": true,
    "helmet_battery_percent": 86,
    "main_battery_percent": 72,
    "relay_state": true,
    "signal_strength": -75
  }'
```

---

## ESP32 Example JSON Payloads

### Main Unit → POST /api/device/telemetry
```json
{
  "helmet_id": "HELM-001",
  "helmet_worn": true,
  "relay_state": true,
  "helmet_battery_percent": 85.0,
  "helmet_battery_voltage": 3.92,
  "main_battery_percent": 72.0,
  "main_battery_voltage": 3.85,
  "latitude": 31.52045,
  "longitude": 74.35869,
  "speed_kmph": 35.2,
  "gps_valid": true,
  "signal_strength": -73,
  "event_type": "heartbeat",
  "event_message": "Periodic telemetry"
}
```

### Main Unit → GET /api/device/:id/contact (response)
```json
{
  "success": true,
  "message": "Emergency contact retrieved",
  "data": {
    "id": "uuid",
    "name": "Ahmed Ali",
    "phone_number": "+923009876543",
    "is_fallback": false
  }
}
```

### Main Unit → POST /api/device/event (accident)
```json
{
  "event_type": "accident_confirmed",
  "event_message": "Accelerometer threshold breached",
  "metadata": {
    "g_force": 12.4,
    "lat": 31.5204,
    "lng": 74.3587
  }
}
```

---

## Event Types

| Event | Severity | Description |
|-------|----------|-------------|
| `heartbeat` | INFO | Periodic alive ping |
| `helmet_status_changed` | INFO | Helmet put on/removed |
| `relay_on` | INFO | Relay/ignition enabled |
| `relay_off` | INFO | Relay/ignition disabled |
| `emergency_button` | CRITICAL | SOS button pressed |
| `emergency_sms_sent` | CRITICAL | SMS dispatched from device |
| `low_battery_main` | WARNING | Main unit battery low |
| `low_battery_helmet` | WARNING | Helmet battery low |
| `accident_suspected` | CRITICAL | Possible accident detected |
| `accident_confirmed` | CRITICAL | Accident confirmed |
| `gps_fix_lost` | WARNING | GPS signal lost |
| `gps_fix_restored` | INFO | GPS signal restored |

---

## Deployment (Render / VPS)

### Environment variables to set in production:
```
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<64+ char random string>
DEVICE_TOKEN_SECRET=<64+ char random string>
CORS_ORIGINS=https://yourdomain.com
```

### Render (Web Service):
1. Connect GitHub repo
2. Build command: `npm install && npm run prisma:generate && npm run build`
3. Start command: `npm run prisma:migrate:prod && node dist/server.js`
4. Add `DATABASE_URL` as env var (use Render PostgreSQL add-on)

### VPS (Ubuntu):
```bash
# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone, install, build
npm ci
npm run build
npm run prisma:migrate:prod
npm run prisma:seed

# Use PM2
npm install -g pm2
pm2 start dist/server.js --name smart-helmet-backend
pm2 save
pm2 startup
```

### ngrok (testing):
```bash
ngrok http 3000
# Use the HTTPS URL as your ESP32 backend URL
```

---

## Security Notes

1. **Never commit `.env`** — use `.env.example` only
2. **Rotate device secrets** after initial deployment via `POST /admin/devices/main/:id/rotate-secret`
3. **Use HTTPS** in production — ngrok provides this for testing
4. **Device secret keys** are stored in plaintext (not hashed) since they must be compared via `timingSafeEqual`. Protect your database.
5. For production, consider moving device secrets to a secrets manager (AWS Secrets Manager, etc.)
"# Smart-Helmet-" 
