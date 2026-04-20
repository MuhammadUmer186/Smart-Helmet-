import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AdminTokenPayload {
  sub: string;
  email: string;
  role: string;
  type: "admin";
}

export interface DeviceTokenPayload {
  sub: string;
  device_id: string;
  type: "device";
}

export const signAdminToken = (payload: Omit<AdminTokenPayload, "type">): string => {
  return jwt.sign({ ...payload, type: "admin" }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
    issuer: "smart-helmet-backend",
    audience: "admin",
  });
};

export const verifyAdminToken = (token: string): AdminTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: "smart-helmet-backend",
    audience: "admin",
  }) as AdminTokenPayload;
};

export const signDeviceToken = (payload: Omit<DeviceTokenPayload, "type">): string => {
  return jwt.sign({ ...payload, type: "device" }, env.DEVICE_TOKEN_SECRET, {
    expiresIn: env.DEVICE_TOKEN_EXPIRES_IN as any,
    issuer: "smart-helmet-backend",
    audience: "device",
  });
};

export const verifyDeviceToken = (token: string): DeviceTokenPayload => {
  return jwt.verify(token, env.DEVICE_TOKEN_SECRET, {
    issuer: "smart-helmet-backend",
    audience: "device",
  }) as DeviceTokenPayload;
};
