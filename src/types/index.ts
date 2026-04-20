import { Request } from "express";
import { AdminTokenPayload, DeviceTokenPayload } from "../utils/jwt";

export interface AuthenticatedAdminRequest extends Request {
  admin: AdminTokenPayload;
}

export interface AuthenticatedDeviceRequest extends Request {
  device: {
    id: string;
    device_id: string;
    name: string;
  };
  deviceToken?: DeviceTokenPayload;
}

export type EventType =
  | "heartbeat"
  | "helmet_status_changed"
  | "relay_on"
  | "relay_off"
  | "emergency_button"
  | "emergency_sms_sent"
  | "low_battery_main"
  | "low_battery_helmet"
  | "accident_suspected"
  | "accident_confirmed"
  | "gps_fix_lost"
  | "gps_fix_restored";

export type Severity = "INFO" | "WARNING" | "CRITICAL";

export const EVENT_SEVERITY_MAP: Record<EventType, Severity> = {
  heartbeat: "INFO",
  helmet_status_changed: "INFO",
  relay_on: "INFO",
  relay_off: "INFO",
  emergency_button: "CRITICAL",
  emergency_sms_sent: "CRITICAL",
  low_battery_main: "WARNING",
  low_battery_helmet: "WARNING",
  accident_suspected: "CRITICAL",
  accident_confirmed: "CRITICAL",
  gps_fix_lost: "WARNING",
  gps_fix_restored: "INFO",
};

export const ONLINE_THRESHOLD_SECONDS = 90;
