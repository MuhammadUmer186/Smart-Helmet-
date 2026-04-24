import { z } from "zod";

export const deviceAuthSchema = z.object({
  device_id: z.string().min(1, "device_id is required"),
  secret_key: z.string().min(1, "secret_key is required"),
});

export const telemetrySchema = z.object({
  helmet_id: z.string().optional(),
  timestamp: z.string().datetime({ offset: true }).optional(),

  helmet_worn: z.boolean().optional(),
  relay_state: z.boolean().optional(),

  helmet_battery_percent: z.number().min(0).max(100).optional(),
  helmet_battery_voltage: z.number().min(0).max(10).optional(),
  main_battery_percent: z.number().min(0).max(100).optional(),
  main_battery_voltage: z.number().min(0).max(10).optional(),

  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  speed_kmph: z.number().min(0).max(500).optional(),
  gps_valid: z.boolean().optional(),

  signal_strength: z.number().int().min(-200).max(0).optional(),

  event_type: z
    .enum([
      "heartbeat",
      "helmet_status_changed",
      "relay_on",
      "relay_off",
      "emergency_button",
      "emergency_sms_sent",
      "low_battery_main",
      "low_battery_helmet",
      "accident_suspected",
      "accident_confirmed",
      "gps_fix_lost",
      "gps_fix_restored",
      "tariff_high_rate_load",
      "theft_suspected",
    ])
    .optional(),
  event_message: z.string().max(500).optional(),

  raw_payload: z.record(z.unknown()).optional(),
});

export const eventSchema = z.object({
  helmet_id: z.string().optional(),
  event_type: z.enum([
    "heartbeat",
    "helmet_status_changed",
    "relay_on",
    "relay_off",
    "emergency_button",
    "emergency_sms_sent",
    "low_battery_main",
    "low_battery_helmet",
    "accident_suspected",
    "accident_confirmed",
    "gps_fix_lost",
    "gps_fix_restored",
    "tariff_high_rate_load",
    "theft_suspected",
  ]),
  event_message: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime({ offset: true }).optional(),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed_kmph: z.number().min(0).max(500).optional(),
  gps_valid: z.boolean().optional().default(true),
  timestamp: z.string().datetime({ offset: true }).optional(),
});

export const heartbeatSchema = z.object({
  helmet_id: z.string().optional(),
  helmet_worn: z.boolean().optional(),
  helmet_battery_percent: z.number().min(0).max(100).optional(),
  main_battery_percent: z.number().min(0).max(100).optional(),
  relay_state: z.boolean().optional(),
  signal_strength: z.number().int().min(-200).max(0).optional(),
  firmware_version: z.string().max(20).optional(),
});
