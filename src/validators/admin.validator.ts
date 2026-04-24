import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createMainDeviceSchema = z.object({
  device_id: z.string().min(3).max(64),
  name: z.string().min(1).max(100),
  firmware_version: z.string().max(20).optional(),
  sim_number: z.string().max(20).optional(),
});

export const updateMainDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  firmware_version: z.string().max(20).optional(),
  sim_number: z.string().max(20).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export const createHelmetDeviceSchema = z.object({
  helmet_id: z.string().min(3).max(64),
  name: z.string().min(1).max(100),
  firmware_version: z.string().max(20).optional(),
});

export const updateHelmetDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  firmware_version: z.string().max(20).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export const pairDevicesSchema = z.object({
  main_device_id: z.string().uuid("Invalid main device ID"),
  helmet_device_id: z.string().uuid("Invalid helmet device ID"),
});

export const createContactSchema = z.object({
  device_id: z.string().uuid("Invalid device ID"),
  name: z.string().min(1).max(100),
  phone_number: z
    .string()
    .min(7)
    .max(20)
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
  is_primary: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  notes: z.string().max(255).optional(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone_number: z
    .string()
    .min(7)
    .max(20)
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format")
    .optional(),
  is_primary: z.boolean().optional(),
  is_active: z.boolean().optional(),
  notes: z.string().max(255).optional(),
});

export const updateDeviceConfigSchema = z.object({
  relay_enabled: z.boolean().optional(),
  heartbeat_interval_sec: z.number().int().min(5).max(3600).optional(),
  telemetry_interval_sec: z.number().int().min(10).max(3600).optional(),
  low_battery_threshold_main: z.number().int().min(1).max(99).optional(),
  low_battery_threshold_helmet: z.number().int().min(1).max(99).optional(),
  emergency_sms_enabled: z.boolean().optional(),
  emergency_backend_enabled: z.boolean().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const telemetryQuerySchema = paginationSchema.extend({
  device_id: z.string().optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
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
});
