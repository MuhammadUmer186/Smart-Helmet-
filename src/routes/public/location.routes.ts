import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { sendSuccess, sendError } from "../../utils/response";
import * as telemetryService from "../../services/device/telemetry.service";

const router = Router();

// Public endpoint for ESP32 — no auth required
// POST /api/public/location/:deviceId
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

export default router;
