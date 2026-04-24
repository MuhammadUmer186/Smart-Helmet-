import { prisma } from "../../config/database";
import { ONLINE_THRESHOLD_SECONDS } from "../../types";
import { computeAnomalyScore } from "../device/detection.service";

export const getDashboardSummary = async () => {
  const onlineThreshold = new Date(Date.now() - ONLINE_THRESHOLD_SECONDS * 1000);

  const [
    totalDevices,
    activeDevices,
    onlineDevices,
    totalContacts,
    totalTelemetry,
    recentEvents,
    criticalEvents,
    latestTelemetry,
  ] = await Promise.all([
    prisma.mainDevice.count(),
    prisma.mainDevice.count({ where: { status: "ACTIVE" } }),
    prisma.mainDevice.count({ where: { status: "ACTIVE", last_seen: { gte: onlineThreshold } } }),
    prisma.emergencyContact.count({ where: { is_active: true } }),
    prisma.telemetry.count(),
    prisma.deviceEvent.findMany({
      take: 10,
      orderBy: { timestamp: "desc" },
      include: { main_device: { select: { device_id: true, name: true } } },
    }),
    prisma.deviceEvent.count({
      where: {
        severity: "CRITICAL",
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.telemetry.findMany({
      take: 5,
      orderBy: { timestamp: "desc" },
      distinct: ["device_id"],
      include: { main_device: { select: { device_id: true, name: true } } },
    }),
  ]);

  return {
    stats: {
      total_devices: totalDevices,
      active_devices: activeDevices,
      online_devices: onlineDevices,
      offline_devices: activeDevices - onlineDevices,
      total_emergency_contacts: totalContacts,
      total_telemetry_records: totalTelemetry,
      critical_events_24h: criticalEvents,
    },
    recent_events: recentEvents,
    latest_telemetry: latestTelemetry,
  };
};

export const getDeviceStatuses = async () => {
  const onlineThreshold = new Date(Date.now() - ONLINE_THRESHOLD_SECONDS * 1000);

  const devices = await prisma.mainDevice.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      device_id: true,
      name: true,
      last_seen: true,
      firmware_version: true,
      pairing: { include: { helmet_device: true } },
      telemetry: {
        take: 1,
        orderBy: { timestamp: "desc" },
        select: {
          helmet_worn: true,
          relay_state: true,
          main_battery_percent: true,
          helmet_battery_percent: true,
          latitude: true,
          longitude: true,
          gps_valid: true,
          signal_strength: true,
          timestamp: true,
        },
      },
    },
  });

  const scores = await Promise.all(devices.map((d) => computeAnomalyScore(d.id)));

  return devices.map((d, idx) => ({
    ...d,
    is_online: d.last_seen ? d.last_seen >= onlineThreshold : false,
    latest_state: d.telemetry[0] ?? null,
    anomaly_score: scores[idx],
    telemetry: undefined,
  }));
};

export const getMapLocations = async () => {
  const devices = await prisma.mainDevice.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      device_id: true,
      name: true,
      last_seen: true,
      telemetry: {
        where: { gps_valid: true, latitude: { not: null }, longitude: { not: null } },
        take: 1,
        orderBy: { timestamp: "desc" },
        select: {
          latitude: true,
          longitude: true,
          speed_kmph: true,
          timestamp: true,
          helmet_worn: true,
        },
      },
    },
  });

  return devices
    .filter((d) => d.telemetry.length > 0)
    .map((d) => ({
      device_id: d.device_id,
      name: d.name,
      last_seen: d.last_seen,
      location: d.telemetry[0],
    }));
};
