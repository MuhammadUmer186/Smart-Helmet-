import { Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { sendError } from "../utils/response";
import { compareSecretKey } from "../utils/crypto";
import { verifyDeviceToken } from "../utils/jwt";
import { AuthenticatedDeviceRequest } from "../types";

/**
 * Strategy 1: x-device-id + x-device-secret headers (for embedded ESP32 clients).
 * Strategy 2: Bearer device JWT token (after /device/auth).
 * Either strategy is accepted.
 */
export const deviceAuth = async (
  req: AuthenticatedDeviceRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = verifyDeviceToken(token);

      const device = await prisma.mainDevice.findUnique({
        where: { id: payload.sub, status: "ACTIVE" },
        select: { id: true, device_id: true, name: true },
      });

      if (!device) {
        sendError(res, "Device not found or inactive", 401, "DEVICE_INACTIVE");
        return;
      }

      req.device = device;
      req.deviceToken = payload;
      next();
      return;
    }

    const deviceId = req.headers["x-device-id"] as string;
    const deviceSecret = req.headers["x-device-secret"] as string;

    if (!deviceId || !deviceSecret) {
      sendError(
        res,
        "Authentication required: provide Bearer token or x-device-id + x-device-secret headers",
        401,
        "NO_AUTH"
      );
      return;
    }

    const device = await prisma.mainDevice.findUnique({
      where: { device_id: deviceId, status: "ACTIVE" },
      select: { id: true, device_id: true, name: true, secret_key: true },
    });

    if (!device) {
      sendError(res, "Device not found or inactive", 401, "DEVICE_NOT_FOUND");
      return;
    }

    if (!compareSecretKey(deviceSecret, device.secret_key)) {
      sendError(res, "Invalid device credentials", 401, "INVALID_SECRET");
      return;
    }

    req.device = { id: device.id, device_id: device.device_id, name: device.name };
    next();
  } catch (err) {
    next(err);
  }
};
