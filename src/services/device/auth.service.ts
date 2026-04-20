import { prisma } from "../../config/database";
import { compareSecretKey } from "../../utils/crypto";
import { signDeviceToken } from "../../utils/jwt";
import { AppError } from "../../middleware/errorHandler";

export const authenticateDevice = async (device_id: string, secret_key: string) => {
  const device = await prisma.mainDevice.findUnique({
    where: { device_id },
    select: { id: true, device_id: true, name: true, secret_key: true, status: true },
  });

  if (!device || device.status !== "ACTIVE") {
    throw new AppError("Device not found or inactive", 401);
  }

  if (!compareSecretKey(secret_key, device.secret_key)) {
    throw new AppError("Invalid device credentials", 401);
  }

  const token = signDeviceToken({ sub: device.id, device_id: device.device_id });

  await prisma.mainDevice.update({
    where: { id: device.id },
    data: { last_seen: new Date() },
  });

  return { token, device: { id: device.id, device_id: device.device_id, name: device.name } };
};

export const getDeviceConfig = async (device_id: string) => {
  const device = await prisma.mainDevice.findUnique({
    where: { device_id, status: "ACTIVE" },
    include: { config: true },
  });

  if (!device) throw new AppError("Device not found or inactive", 404);

  const config = device.config ?? {
    relay_enabled: true,
    heartbeat_interval_sec: 30,
    telemetry_interval_sec: 60,
    low_battery_threshold_main: 20,
    low_battery_threshold_helmet: 20,
    emergency_sms_enabled: true,
    emergency_backend_enabled: true,
  };

  return config;
};
