import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { sendSuccess, sendError } from "../../utils/response";
import * as telemetryService from "../../services/device/telemetry.service";

const router = Router();

// POST /api/public/location/:deviceId — ESP32 sends location
router.post("/:deviceId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const { latitude, longitude, speed_kmph, gps_valid, timestamp } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return sendError(res, "latitude and longitude are required numbers", 400, "INVALID_BODY");
    }

    const device = await prisma.mainDevice.findUnique({ where: { device_id: deviceId } });
    if (!device) {
      return sendError(res, "Device not found", 404, "NOT_FOUND");
    }

    await telemetryService.storeLocation(device.id, { latitude, longitude, speed_kmph, gps_valid, timestamp });

    return sendSuccess(res, { device_id: deviceId, latitude, longitude }, "Location saved");
  } catch (err) {
    next(err);
  }
});

// GET /api/public/location/:deviceId — fetch latest location
router.get("/:deviceId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;

    const device = await prisma.mainDevice.findUnique({ where: { device_id: deviceId } });
    if (!device) {
      return sendError(res, "Device not found", 404, "NOT_FOUND");
    }

    const latest = await prisma.telemetry.findFirst({
      where: { device_id: device.id, latitude: { not: null }, longitude: { not: null } },
      orderBy: { timestamp: "desc" },
      select: { latitude: true, longitude: true, speed_kmph: true, gps_valid: true, timestamp: true },
    });

    if (!latest) {
      return sendError(res, "No location data yet", 404, "NOT_FOUND");
    }

    return sendSuccess(res, latest);
  } catch (err) {
    next(err);
  }
});

export default router;
