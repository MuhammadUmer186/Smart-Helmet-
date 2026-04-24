import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { EventType, Prisma, Severity, Telemetry } from "@prisma/client";

function isHighRateHour(date: Date): boolean {
  const h = date.getHours();
  const start = env.TARIFF_HIGH_RATE_START_HOUR;
  const end = env.TARIFF_HIGH_RATE_END_HOUR;

  // supports ranges that wrap midnight (e.g., 18 -> 6)
  if (start === end) return true;
  if (start < end) return h >= start && h < end;
  return h >= start || h < end;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function extractLoadWatts(raw: unknown): number | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Record<string, unknown>;

  // Accept a few common names so firmware/frontends can evolve.
  return (
    asNumber(payload.load_watts) ??
    asNumber(payload.load_w) ??
    asNumber(payload.power_watts) ??
    asNumber(payload.power_w) ??
    asNumber(payload.watts) ??
    null
  );
}

export async function pruneOldDeviceData(deviceId: string): Promise<void> {
  const cutoff = new Date(Date.now() - env.DATA_RETENTION_WINDOW_MS);

  // Keep only last hour telemetry + events
  await prisma.$transaction([
    prisma.telemetry.deleteMany({
      where: { device_id: deviceId, timestamp: { lt: cutoff } },
    }),
    prisma.deviceEvent.deleteMany({
      where: { device_id: deviceId, timestamp: { lt: cutoff } },
    }),
  ]);
}

export async function maybeCreateTariffAlert(deviceId: string, telemetry: Telemetry): Promise<void> {
  if (!telemetry.timestamp) return;
  if (!isHighRateHour(telemetry.timestamp)) return;

  const loadWatts = extractLoadWatts(telemetry.raw_payload);
  if (loadWatts == null) return;
  if (loadWatts < env.HIGH_LOAD_WATTS_THRESHOLD) return;

  // De-dupe: don't spam the same alert every telemetry post.
  const recentCutoff = new Date(Date.now() - 10 * 60 * 1000);
  const existing = await prisma.deviceEvent.findFirst({
    where: {
      device_id: deviceId,
      event_type: "tariff_high_rate_load",
      timestamp: { gte: recentCutoff },
    },
    select: { id: true },
  });
  if (existing) return;

  await prisma.deviceEvent.create({
    data: {
      device_id: deviceId,
      event_type: "tariff_high_rate_load",
      severity: "WARNING",
      event_message: `High load (${Math.round(loadWatts)}W) during high-rate hours. Avoid heavy loads now to reduce cost.`,
      metadata: { load_watts: loadWatts, threshold_watts: env.HIGH_LOAD_WATTS_THRESHOLD },
    },
  });
}

export async function maybeCreateTheftAlert(deviceId: string): Promise<void> {
  const cutoff = new Date(Date.now() - env.DATA_RETENTION_WINDOW_MS);

  const samples = await prisma.telemetry.findMany({
    where: {
      device_id: deviceId,
      timestamp: { gte: cutoff },
      gps_valid: true,
      speed_kmph: { gt: env.THEFT_SPEED_KMPH_THRESHOLD },
      // Theft heuristic: bike moving while relay is OFF (engine/relay not engaged)
      relay_state: false,
    },
    orderBy: { timestamp: "desc" },
    take: env.THEFT_MIN_SAMPLES,
    select: { timestamp: true, speed_kmph: true, latitude: true, longitude: true },
  });

  if (samples.length < env.THEFT_MIN_SAMPLES) return;

  // De-dupe: don't create multiple theft events too frequently.
  const recentCutoff = new Date(Date.now() - 10 * 60 * 1000);
  const existing = await prisma.deviceEvent.findFirst({
    where: { device_id: deviceId, event_type: "theft_suspected", timestamp: { gte: recentCutoff } },
    select: { id: true },
  });
  if (existing) return;

  const maxSpeed = Math.max(...samples.map((s) => s.speed_kmph ?? 0));
  const latest = samples[0];

  await prisma.deviceEvent.create({
    data: {
      device_id: deviceId,
      event_type: "theft_suspected",
      severity: "CRITICAL",
      event_message: `Theft suspected: movement detected while relay OFF (max ${Math.round(maxSpeed)} km/h).`,
      metadata: {
        max_speed_kmph: maxSpeed,
        threshold_speed_kmph: env.THEFT_SPEED_KMPH_THRESHOLD,
        latest_location: latest.latitude != null && latest.longitude != null ? { latitude: latest.latitude, longitude: latest.longitude } : undefined,
      } as Prisma.InputJsonValue,
    },
  });
}

export async function computeAnomalyScore(deviceId: string): Promise<number> {
  const cutoff = new Date(Date.now() - env.DATA_RETENTION_WINDOW_MS);
  const now = Date.now();

  const events = await prisma.deviceEvent.findMany({
    where: { device_id: deviceId, timestamp: { gte: cutoff } },
    orderBy: { timestamp: "desc" },
    select: { severity: true, timestamp: true, event_type: true },
  });

  // Weighted + time-decayed score over last hour.
  // This guarantees the score naturally goes down as time passes.
  const baseWeight: Record<Severity, number> = { INFO: 5, WARNING: 20, CRITICAL: 40 };

  let score = 0;
  for (const e of events) {
    const ageMin = (now - e.timestamp.getTime()) / 60000;
    const decay = Math.exp(-ageMin / 20); // ~63% decay every 20 minutes
    score += baseWeight[e.severity] * decay;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

