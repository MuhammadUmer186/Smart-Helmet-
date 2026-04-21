import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { sendSuccess, sendError } from "../../utils/response";

const router = Router();

// POST /api/public/emergency/:deviceId — ESP32 reports emergency button press
router.post("/:deviceId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const { latitude, longitude, speed_kmph, gps_valid, message } = req.body;

    const device = await prisma.mainDevice.findUnique({
      where: { device_id: deviceId },
      include: { config: true },
    });
    if (!device) return sendError(res, "Device not found", 404, "NOT_FOUND");

    await prisma.$transaction([
      prisma.deviceEvent.create({
        data: {
          device_id: device.id,
          event_type: "emergency_button",
          event_message: message || "Emergency button pressed",
          severity: "CRITICAL",
          metadata: latitude != null ? { latitude, longitude, speed_kmph, gps_valid } : undefined,
        },
      }),
      ...(latitude != null && longitude != null
        ? [
            prisma.telemetry.create({
              data: {
                device_id: device.id,
                latitude,
                longitude,
                speed_kmph: speed_kmph ?? null,
                gps_valid: gps_valid ?? true,
                event_type: "emergency_button",
                event_message: message || "Emergency button pressed",
              },
            }),
          ]
        : []),
    ]);

    const relay_command = device.config?.relay_command ?? false;
    return sendSuccess(res, { relay_command }, "Emergency recorded");
  } catch (err) {
    next(err);
  }
});

// GET /api/public/emergency/:deviceId — fetch latest emergency event (for frontend polling)
router.get("/:deviceId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;

    const device = await prisma.mainDevice.findUnique({ where: { device_id: deviceId } });
    if (!device) return sendError(res, "Device not found", 404, "NOT_FOUND");

    const latest = await prisma.deviceEvent.findFirst({
      where: { device_id: device.id, event_type: "emergency_button" },
      orderBy: { timestamp: "desc" },
      select: { id: true, event_message: true, severity: true, metadata: true, timestamp: true },
    });

    return sendSuccess(res, latest ?? null);
  } catch (err) {
    next(err);
  }
});

export default router;
