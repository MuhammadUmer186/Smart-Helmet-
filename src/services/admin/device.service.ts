import { prisma } from "../../config/database";
import { generateSecretKey } from "../../utils/crypto";
import { AppError } from "../../middleware/errorHandler";

export const createMainDevice = async (data: {
  device_id: string;
  name: string;
  firmware_version?: string;
  sim_number?: string;
}) => {
  const existing = await prisma.mainDevice.findUnique({ where: { device_id: data.device_id } });
  if (existing) throw new AppError(`Device ID '${data.device_id}' already registered`, 409);

  const secret_key = generateSecretKey();

  const device = await prisma.mainDevice.create({
    data: { ...data, secret_key },
  });

  await prisma.deviceConfig.create({ data: { device_id: device.id } });

  return { ...device, secret_key };
};

export const listMainDevices = async (skip: number, take: number) => {
  const [devices, total] = await Promise.all([
    prisma.mainDevice.findMany({
      skip,
      take,
      orderBy: { created_at: "desc" },
      include: {
        pairing: { include: { helmet_device: true } },
        config: true,
        _count: { select: { telemetry: true, events: true, contacts: true } },
      },
    }),
    prisma.mainDevice.count(),
  ]);
  return { devices, total };
};

export const getMainDevice = async (id: string) => {
  const device = await prisma.mainDevice.findUnique({
    where: { id },
    include: {
      pairing: { include: { helmet_device: true } },
      contacts: { where: { is_active: true }, orderBy: { is_primary: "desc" } },
      config: true,
      _count: { select: { telemetry: true, events: true } },
    },
  });
  if (!device) throw new AppError("Device not found", 404);
  return device;
};

export const updateMainDevice = async (
  id: string,
  data: { name?: string; firmware_version?: string; sim_number?: string; status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" }
) => {
  const device = await prisma.mainDevice.findUnique({ where: { id } });
  if (!device) throw new AppError("Device not found", 404);
  return prisma.mainDevice.update({ where: { id }, data });
};

export const rotateDeviceSecret = async (id: string) => {
  const device = await prisma.mainDevice.findUnique({ where: { id } });
  if (!device) throw new AppError("Device not found", 404);
  const secret_key = generateSecretKey();
  await prisma.mainDevice.update({ where: { id }, data: { secret_key } });
  return { device_id: device.device_id, secret_key };
};

export const createHelmetDevice = async (data: {
  helmet_id: string;
  name: string;
  firmware_version?: string;
}) => {
  const existing = await prisma.helmetDevice.findUnique({ where: { helmet_id: data.helmet_id } });
  if (existing) throw new AppError(`Helmet ID '${data.helmet_id}' already registered`, 409);
  return prisma.helmetDevice.create({ data });
};

export const listHelmetDevices = async (skip: number, take: number) => {
  const [devices, total] = await Promise.all([
    prisma.helmetDevice.findMany({
      skip,
      take,
      orderBy: { created_at: "desc" },
      include: { pairing: { include: { main_device: true } } },
    }),
    prisma.helmetDevice.count(),
  ]);
  return { devices, total };
};

export const pairDevices = async (main_device_id: string, helmet_device_id: string) => {
  const [mainDevice, helmetDevice] = await Promise.all([
    prisma.mainDevice.findUnique({ where: { id: main_device_id } }),
    prisma.helmetDevice.findUnique({ where: { id: helmet_device_id } }),
  ]);

  if (!mainDevice) throw new AppError("Main device not found", 404);
  if (!helmetDevice) throw new AppError("Helmet device not found", 404);

  const existingPairing = await prisma.devicePairing.findFirst({
    where: {
      OR: [{ main_device_id }, { helmet_id: helmet_device_id }],
    },
  });

  if (existingPairing) {
    throw new AppError("One or both devices are already paired", 409);
  }

  return prisma.devicePairing.create({
    data: { main_device_id, helmet_id: helmet_device_id },
    include: { main_device: true, helmet_device: true },
  });
};

export const unpairDevices = async (pairingId: string) => {
  const pairing = await prisma.devicePairing.findUnique({ where: { id: pairingId } });
  if (!pairing) throw new AppError("Pairing not found", 404);
  return prisma.devicePairing.delete({ where: { id: pairingId } });
};

export const setRelayCommand = async (deviceId: string, relay_command: boolean) => {
  const device = await prisma.mainDevice.findUnique({ where: { id: deviceId } });
  if (!device) throw new AppError("Device not found", 404);

  return prisma.deviceConfig.upsert({
    where: { device_id: deviceId },
    create: { device_id: deviceId, relay_command },
    update: { relay_command },
  });
};

export const getEmergencyEvents = async (deviceId: string, limit = 10) => {
  const device = await prisma.mainDevice.findUnique({ where: { id: deviceId } });
  if (!device) throw new AppError("Device not found", 404);

  return prisma.deviceEvent.findMany({
    where: { device_id: deviceId, event_type: "emergency_button" },
    orderBy: { timestamp: "desc" },
    take: limit,
    select: { id: true, event_message: true, severity: true, metadata: true, timestamp: true },
  });
};

export const updateDeviceConfig = async (
  deviceId: string,
  data: {
    relay_enabled?: boolean;
    heartbeat_interval_sec?: number;
    telemetry_interval_sec?: number;
    low_battery_threshold_main?: number;
    low_battery_threshold_helmet?: number;
    emergency_sms_enabled?: boolean;
    emergency_backend_enabled?: boolean;
  }
) => {
  const device = await prisma.mainDevice.findUnique({ where: { id: deviceId } });
  if (!device) throw new AppError("Device not found", 404);

  return prisma.deviceConfig.upsert({
    where: { device_id: deviceId },
    create: { device_id: deviceId, ...data },
    update: data,
  });
};
