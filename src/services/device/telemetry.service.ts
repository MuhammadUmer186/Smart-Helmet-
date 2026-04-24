import { prisma } from "../../config/database";
import { EventType, Prisma } from "@prisma/client";
import { EVENT_SEVERITY_MAP } from "../../types";
import { maybeCreateTariffAlert, maybeCreateTheftAlert, pruneOldDeviceData } from "./detection.service";

export const storeTelemetry = async (
  deviceId: string,
  data: {
    helmet_id?: string;
    timestamp?: string;
    helmet_worn?: boolean;
    relay_state?: boolean;
    helmet_battery_percent?: number;
    helmet_battery_voltage?: number;
    main_battery_percent?: number;
    main_battery_voltage?: number;
    latitude?: number;
    longitude?: number;
    speed_kmph?: number;
    gps_valid?: boolean;
    signal_strength?: number;
    event_type?: EventType;
    event_message?: string;
    raw_payload?: Record<string, unknown>;
  }
) => {
  const ts = data.timestamp ? new Date(data.timestamp) : new Date();

  const [telemetry] = await Promise.all([
    prisma.telemetry.create({
      data: {
        device_id: deviceId,
        helmet_id: data.helmet_id,
        timestamp: ts,
        helmet_worn: data.helmet_worn,
        relay_state: data.relay_state,
        helmet_battery_percent: data.helmet_battery_percent,
        helmet_battery_voltage: data.helmet_battery_voltage,
        main_battery_percent: data.main_battery_percent,
        main_battery_voltage: data.main_battery_voltage,
        latitude: data.latitude,
        longitude: data.longitude,
        speed_kmph: data.speed_kmph,
        gps_valid: data.gps_valid,
        signal_strength: data.signal_strength,
        event_type: data.event_type,
        event_message: data.event_message,
        raw_payload: data.raw_payload as Prisma.InputJsonValue | undefined,
      },
    }),
    prisma.mainDevice.update({
      where: { id: deviceId },
      data: { last_seen: ts },
    }),
  ]);

  // Keep only last hour data + generate alerts from last hour window
  await pruneOldDeviceData(deviceId);
  await maybeCreateTariffAlert(deviceId, telemetry);
  await maybeCreateTheftAlert(deviceId);

  return telemetry;
};

export const storeEvent = async (
  deviceId: string,
  data: {
    helmet_id?: string;
    event_type: EventType;
    event_message?: string;
    metadata?: Record<string, unknown>;
    timestamp?: string;
  }
) => {
  const ts = data.timestamp ? new Date(data.timestamp) : new Date();
  const severity = EVENT_SEVERITY_MAP[data.event_type as keyof typeof EVENT_SEVERITY_MAP];

  const [event] = await Promise.all([
    prisma.deviceEvent.create({
      data: {
        device_id: deviceId,
        helmet_id: data.helmet_id,
        event_type: data.event_type,
        event_message: data.event_message,
        severity,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
        timestamp: ts,
      },
    }),
    prisma.mainDevice.update({
      where: { id: deviceId },
      data: { last_seen: ts },
    }),
  ]);

  return event;
};

export const storeLocation = async (
  deviceId: string,
  data: {
    latitude: number;
    longitude: number;
    speed_kmph?: number;
    gps_valid?: boolean;
    timestamp?: string;
  }
) => {
  const ts = data.timestamp ? new Date(data.timestamp) : new Date();

  const [telemetry] = await Promise.all([
    prisma.telemetry.create({
      data: {
        device_id: deviceId,
        timestamp: ts,
        latitude: data.latitude,
        longitude: data.longitude,
        speed_kmph: data.speed_kmph,
        gps_valid: data.gps_valid ?? true,
        event_type: "heartbeat",
      },
    }),
    prisma.mainDevice.update({
      where: { id: deviceId },
      data: { last_seen: ts },
    }),
  ]);

  return telemetry;
};

export const storeHeartbeat = async (
  deviceId: string,
  data: {
    helmet_id?: string;
    helmet_worn?: boolean;
    helmet_battery_percent?: number;
    main_battery_percent?: number;
    relay_state?: boolean;
    signal_strength?: number;
    firmware_version?: string;
  }
) => {
  const now = new Date();

  const updates: Record<string, unknown> = { last_seen: now };
  if (data.firmware_version) updates.firmware_version = data.firmware_version;

  const [telemetry] = await Promise.all([
    prisma.telemetry.create({
      data: {
        device_id: deviceId,
        timestamp: now,
        helmet_id: data.helmet_id,
        helmet_worn: data.helmet_worn,
        relay_state: data.relay_state,
        helmet_battery_percent: data.helmet_battery_percent,
        main_battery_percent: data.main_battery_percent,
        signal_strength: data.signal_strength,
        event_type: "heartbeat",
        event_message: "Heartbeat",
      },
    }),
    prisma.mainDevice.update({
      where: { id: deviceId },
      data: updates,
    }),
  ]);

  return telemetry;
};
