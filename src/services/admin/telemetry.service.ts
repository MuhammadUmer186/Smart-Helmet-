import { prisma } from "../../config/database";
import { EventType } from "@prisma/client";

export const listTelemetry = async (params: {
  skip: number;
  take: number;
  device_id?: string;
  from?: string;
  to?: string;
  event_type?: EventType;
}) => {
  const where: Record<string, unknown> = {};
  if (params.device_id) where.device_id = params.device_id;
  if (params.event_type) where.event_type = params.event_type;
  if (params.from || params.to) {
    where.timestamp = {
      ...(params.from ? { gte: new Date(params.from) } : {}),
      ...(params.to ? { lte: new Date(params.to) } : {}),
    };
  }

  const [records, total] = await Promise.all([
    prisma.telemetry.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { timestamp: "desc" },
      include: { main_device: { select: { device_id: true, name: true } } },
    }),
    prisma.telemetry.count({ where }),
  ]);
  return { records, total };
};

export const getLatestTelemetry = async (deviceId: string) => {
  return prisma.telemetry.findFirst({
    where: { device_id: deviceId },
    orderBy: { timestamp: "desc" },
  });
};

export const listEvents = async (params: {
  skip: number;
  take: number;
  device_id?: string;
  from?: string;
  to?: string;
  event_type?: EventType;
}) => {
  const where: Record<string, unknown> = {};
  if (params.device_id) where.device_id = params.device_id;
  if (params.event_type) where.event_type = params.event_type;
  if (params.from || params.to) {
    where.timestamp = {
      ...(params.from ? { gte: new Date(params.from) } : {}),
      ...(params.to ? { lte: new Date(params.to) } : {}),
    };
  }

  const [records, total] = await Promise.all([
    prisma.deviceEvent.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { timestamp: "desc" },
      include: { main_device: { select: { device_id: true, name: true } } },
    }),
    prisma.deviceEvent.count({ where }),
  ]);
  return { records, total };
};
