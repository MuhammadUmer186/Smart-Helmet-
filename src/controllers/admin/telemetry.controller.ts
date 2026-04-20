import { Request, Response, NextFunction } from "express";
import * as telemetryService from "../../services/admin/telemetry.service";
import { sendSuccess, sendPaginated, buildPagination, parsePagination } from "../../utils/response";
import { EventType } from "@prisma/client";

export const listTelemetry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { device_id, from, to, event_type } = req.query as Record<string, string>;
    const { records, total } = await telemetryService.listTelemetry({
      skip,
      take: limit,
      device_id,
      from,
      to,
      event_type: event_type as EventType | undefined,
    });
    sendPaginated(res, records, buildPagination(total, page, limit));
  } catch (err) { next(err); }
};

export const getLatestTelemetry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const telemetry = await telemetryService.getLatestTelemetry(req.params.deviceId);
    sendSuccess(res, telemetry);
  } catch (err) { next(err); }
};

export const listEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { device_id, from, to, event_type } = req.query as Record<string, string>;
    const { records, total } = await telemetryService.listEvents({
      skip,
      take: limit,
      device_id,
      from,
      to,
      event_type: event_type as EventType | undefined,
    });
    sendPaginated(res, records, buildPagination(total, page, limit));
  } catch (err) { next(err); }
};
