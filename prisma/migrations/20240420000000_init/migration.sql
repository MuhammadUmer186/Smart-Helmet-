-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('heartbeat', 'helmet_status_changed', 'relay_on', 'relay_off', 'emergency_button', 'emergency_sms_sent', 'low_battery_main', 'low_battery_helmet', 'accident_suspected', 'accident_confirmed', 'gps_fix_lost', 'gps_fix_restored');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main_devices" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "secret_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firmware_version" TEXT,
    "sim_number" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_seen" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "main_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helmet_devices" (
    "id" TEXT NOT NULL,
    "helmet_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firmware_version" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_seen" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helmet_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_pairings" (
    "id" TEXT NOT NULL,
    "main_device_id" TEXT NOT NULL,
    "helmet_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "paired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_pairings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "helmet_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "helmet_worn" BOOLEAN,
    "relay_state" BOOLEAN,
    "helmet_battery_percent" DOUBLE PRECISION,
    "helmet_battery_voltage" DOUBLE PRECISION,
    "main_battery_percent" DOUBLE PRECISION,
    "main_battery_voltage" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "speed_kmph" DOUBLE PRECISION,
    "gps_valid" BOOLEAN,
    "signal_strength" INTEGER,
    "event_type" "EventType",
    "event_message" TEXT,
    "raw_payload" JSONB,

    CONSTRAINT "telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_events" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "helmet_id" TEXT,
    "event_type" "EventType" NOT NULL,
    "event_message" TEXT,
    "severity" "Severity" NOT NULL DEFAULT 'INFO',
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_configs" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "relay_enabled" BOOLEAN NOT NULL DEFAULT true,
    "heartbeat_interval_sec" INTEGER NOT NULL DEFAULT 30,
    "telemetry_interval_sec" INTEGER NOT NULL DEFAULT 60,
    "low_battery_threshold_main" INTEGER NOT NULL DEFAULT 20,
    "low_battery_threshold_helmet" INTEGER NOT NULL DEFAULT 20,
    "emergency_sms_enabled" BOOLEAN NOT NULL DEFAULT true,
    "emergency_backend_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_configs_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "main_devices_device_id_key" ON "main_devices"("device_id");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "helmet_devices_helmet_id_key" ON "helmet_devices"("helmet_id");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "device_pairings_main_device_id_key" ON "device_pairings"("main_device_id");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "device_pairings_helmet_id_key" ON "device_pairings"("helmet_id");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "device_configs_device_id_key" ON "device_configs"("device_id");

-- CreateIndex
CREATE INDEX "telemetry_device_id_timestamp_idx" ON "telemetry"("device_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "telemetry_timestamp_idx" ON "telemetry"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "device_events_device_id_timestamp_idx" ON "device_events"("device_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "device_events_event_type_timestamp_idx" ON "device_events"("event_type", "timestamp" DESC);

-- AddForeignKey
ALTER TABLE "device_pairings" ADD CONSTRAINT "device_pairings_main_device_id_fkey" FOREIGN KEY ("main_device_id") REFERENCES "main_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_pairings" ADD CONSTRAINT "device_pairings_helmet_id_fkey" FOREIGN KEY ("helmet_id") REFERENCES "helmet_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "main_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "main_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_events" ADD CONSTRAINT "device_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "main_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_configs" ADD CONSTRAINT "device_configs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "main_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
