import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { sendSuccess, sendError } from "../../utils/response";

const router = Router();

// GET /api/public/relay/:deviceId — ESP32 polls for relay command
router.get("/:deviceId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;

    const device = await prisma.mainDevice.findUnique({
      where: { device_id: deviceId },
      include: { config: true },
    });
    if (!device) return sendError(res, "Device not found", 404, "NOT_FOUND");

    const relay_command = device.config?.relay_command ?? false;
    return sendSuccess(res, { relay_command });
  } catch (err) {
    next(err);
  }
});

export default router;
