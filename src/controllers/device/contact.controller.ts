import { Response, NextFunction } from "express";
import * as contactService from "../../services/device/contact.service";
import { sendSuccess } from "../../utils/response";
import { AuthenticatedDeviceRequest } from "../../types";

/**
 * @swagger
 * /device/{deviceId}/contact:
 *   get:
 *     tags: [Device]
 *     summary: Fetch primary emergency contact (optimized for embedded clients)
 *     description: |
 *       Returns the primary active emergency contact for SMS dispatch.
 *       Falls back to any active contact if no primary is set.
 *       Response is minimal to reduce GSM data usage.
 *     security:
 *       - DeviceAuth: []
 *       - DeviceSecret: []
 */
export const getPrimaryContact = async (
  req: AuthenticatedDeviceRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const contact = await contactService.getPrimaryContact(req.device.id);
    sendSuccess(res, contact, "Emergency contact retrieved");
  } catch (err) {
    next(err);
  }
};
