import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // ── Admin User ───────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@smarthelmet.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  const adminName = process.env.ADMIN_NAME ?? "System Admin";

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.create({
      data: { email: adminEmail, password: hashed, name: adminName, role: "admin" },
    });
    console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`⏭️  Admin user already exists: ${adminEmail}`);
  }

  // ── Main Device ──────────────────────────────
  const existingMain = await prisma.mainDevice.findUnique({ where: { device_id: "MAIN-DEMO-001" } });
  let mainDevice;
  if (!existingMain) {
    mainDevice = await prisma.mainDevice.create({
      data: {
        device_id: "MAIN-DEMO-001",
        secret_key: "demo_secret_key_change_in_production_32chars",
        name: "Demo Bike Unit",
        firmware_version: "1.0.0",
        sim_number: "+923001234567",
        status: "ACTIVE",
      },
    });
    console.log(`✅ Main device created: ${mainDevice.device_id}`);
    console.log(`   Secret key: demo_secret_key_change_in_production_32chars`);
  } else {
    mainDevice = existingMain;
    console.log(`⏭️  Main device already exists: MAIN-DEMO-001`);
  }

  // ── Helmet Device ────────────────────────────
  const existingHelmet = await prisma.helmetDevice.findUnique({ where: { helmet_id: "HELM-DEMO-001" } });
  let helmetDevice;
  if (!existingHelmet) {
    helmetDevice = await prisma.helmetDevice.create({
      data: {
        helmet_id: "HELM-DEMO-001",
        name: "Demo Helmet Unit",
        firmware_version: "1.0.0",
        status: "ACTIVE",
      },
    });
    console.log(`✅ Helmet device created: ${helmetDevice.helmet_id}`);
  } else {
    helmetDevice = existingHelmet;
    console.log(`⏭️  Helmet device already exists: HELM-DEMO-001`);
  }

  // ── Device Pairing ───────────────────────────
  const existingPairing = await prisma.devicePairing.findUnique({
    where: { main_device_id: mainDevice.id },
  });
  if (!existingPairing) {
    await prisma.devicePairing.create({
      data: {
        main_device_id: mainDevice.id,
        helmet_id: helmetDevice.id,
        is_active: true,
      },
    });
    console.log(`✅ Devices paired`);
  } else {
    console.log(`⏭️  Devices already paired`);
  }

  // ── Emergency Contact ────────────────────────
  const existingContact = await prisma.emergencyContact.findFirst({
    where: { device_id: mainDevice.id },
  });
  if (!existingContact) {
    await prisma.emergencyContact.create({
      data: {
        device_id: mainDevice.id,
        name: "Ahmed Ali (Demo Contact)",
        phone_number: "+923009876543",
        is_primary: true,
        is_active: true,
        notes: "Primary emergency contact — demo data",
      },
    });
    console.log(`✅ Emergency contact created`);
  } else {
    console.log(`⏭️  Emergency contact already exists`);
  }

  // ── Device Config ────────────────────────────
  const existingConfig = await prisma.deviceConfig.findUnique({
    where: { device_id: mainDevice.id },
  });
  if (!existingConfig) {
    await prisma.deviceConfig.create({
      data: {
        device_id: mainDevice.id,
        relay_enabled: true,
        heartbeat_interval_sec: 30,
        telemetry_interval_sec: 60,
        low_battery_threshold_main: 20,
        low_battery_threshold_helmet: 20,
        emergency_sms_enabled: true,
        emergency_backend_enabled: true,
      },
    });
    console.log(`✅ Device config created`);
  } else {
    console.log(`⏭️  Device config already exists`);
  }

  // ── Sample Telemetry ─────────────────────────
  const telemetryCount = await prisma.telemetry.count({ where: { device_id: mainDevice.id } });
  if (telemetryCount === 0) {
    const now = new Date();
    await prisma.telemetry.createMany({
      data: [
        {
          device_id: mainDevice.id,
          helmet_id: "HELM-DEMO-001",
          timestamp: new Date(now.getTime() - 120_000),
          helmet_worn: true,
          relay_state: true,
          helmet_battery_percent: 85,
          helmet_battery_voltage: 3.9,
          main_battery_percent: 72,
          main_battery_voltage: 3.8,
          latitude: 31.5204,
          longitude: 74.3587,
          speed_kmph: 32.5,
          gps_valid: true,
          signal_strength: -75,
          event_type: "heartbeat",
          event_message: "Heartbeat",
        },
        {
          device_id: mainDevice.id,
          helmet_id: "HELM-DEMO-001",
          timestamp: new Date(now.getTime() - 60_000),
          helmet_worn: true,
          relay_state: true,
          helmet_battery_percent: 84,
          main_battery_percent: 71,
          latitude: 31.5210,
          longitude: 74.3595,
          speed_kmph: 28.0,
          gps_valid: true,
          signal_strength: -78,
          event_type: "heartbeat",
          event_message: "Heartbeat",
        },
        {
          device_id: mainDevice.id,
          timestamp: now,
          helmet_worn: false,
          relay_state: false,
          main_battery_percent: 70,
          event_type: "helmet_status_changed",
          event_message: "Helmet removed",
        },
      ],
    });
    console.log(`✅ Sample telemetry created`);
  } else {
    console.log(`⏭️  Telemetry already exists`);
  }

  // ── Sample Event ─────────────────────────────
  const eventCount = await prisma.deviceEvent.count({ where: { device_id: mainDevice.id } });
  if (eventCount === 0) {
    await prisma.deviceEvent.createMany({
      data: [
        {
          device_id: mainDevice.id,
          helmet_id: "HELM-DEMO-001",
          event_type: "helmet_status_changed",
          event_message: "Helmet worn",
          severity: "INFO",
        },
        {
          device_id: mainDevice.id,
          event_type: "relay_on",
          event_message: "Relay enabled — helmet worn",
          severity: "INFO",
        },
      ],
    });
    console.log(`✅ Sample events created`);
  } else {
    console.log(`⏭️  Events already exist`);
  }

  console.log("\n🎉 Seed complete!\n");
  console.log("─".repeat(50));
  console.log(`Admin login:    ${adminEmail} / ${adminPassword}`);
  console.log(`Device ID:      MAIN-DEMO-001`);
  console.log(`Device secret:  demo_secret_key_change_in_production_32chars`);
  console.log("─".repeat(50));
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
