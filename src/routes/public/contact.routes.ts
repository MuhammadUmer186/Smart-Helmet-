import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { sendSuccess, sendError } from "../../utils/response";

const router = Router();

// Public endpoint for ESP32 — no auth required
// GET /api/public/contact/:deviceId  (deviceId = string like "BIKE-001")
router.get("/:deviceId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;

    const device = await prisma.mainDevice.findUnique({ where: { device_id: deviceId } });
    if (!device) {
      return sendError(res, "Device not found", 404, "NOT_FOUND");
    }

    const contact =
      (await prisma.emergencyContact.findFirst({
        where: { device_id: device.id, is_primary: true, is_active: true },
        select: { name: true, phone_number: true },
      })) ??
      (await prisma.emergencyContact.findFirst({
        where: { device_id: device.id, is_active: true },
        orderBy: { created_at: "asc" },
        select: { name: true, phone_number: true },
      }));

    if (!contact) {
      return sendError(res, "No emergency contact configured", 404, "NOT_FOUND");
    }

    return sendSuccess(res, contact);
  } catch (err) {
    next(err);
  }
});

export default router;
