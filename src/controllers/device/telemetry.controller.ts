import { Response, NextFunction } from "express";
import * as telemetryService from "../../services/device/telemetry.service";
import { sendSuccess } from "../../utils/response";
import { AuthenticatedDeviceRequest } from "../../types";

/**
 * @swagger
 * /device/telemetry:
 *   post:
 *     tags: [Device]
 *     summary: Submit telemetry data from main unit
 *     security:
 *       - DeviceAuth: []
 *       - DeviceSecret: []
 */
export const submitTelemetry = async (
  req: AuthenticatedDeviceRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const record = await telemetryService.storeTelemetry(req.device.id, req.body);
    sendSuccess(res, { id: record.id, timestamp: record.timestamp }, "Telemetry stored");
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /device/event:
 *   post:
 *     tags: [Device]
 *     summary: Submit a discrete event from main unit
 */
export const submitEvent = async (
  req: AuthenticatedDeviceRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = await telemetryService.storeEvent(req.device.id, req.body);
    sendSuccess(res, { id: event.id, event_type: event.event_type, timestamp: event.timestamp }, "Event stored");
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /device/location:
 *   post:
 *     tags: [Device]
 *     summary: Submit GPS location update
 */
export const submitLocation = async (
  req: AuthenticatedDeviceRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const record = await telemetryService.storeLocation(req.device.id, req.body);
    sendSuccess(res, { id: record.id, timestamp: record.timestamp }, "Location stored");
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /device/heartbeat:
 *   post:
 *     tags: [Device]
 *     summary: Send a lightweight heartbeat with basic status
 */
export const submitHeartbeat = async (
  req: AuthenticatedDeviceRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const record = await telemetryService.storeHeartbeat(req.device.id, req.body);
    sendSuccess(res, { id: record.id, timestamp: record.timestamp }, "Heartbeat received");
  } catch (err) {
    next(err);
  }
};
