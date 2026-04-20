import { Request, Response, NextFunction } from "express";
import * as authService from "../../services/device/auth.service";
import { sendSuccess } from "../../utils/response";

/**
 * @swagger
 * /device/auth:
 *   post:
 *     tags: [Device]
 *     summary: Authenticate a main device and receive a short-lived JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [device_id, secret_key]
 *             properties:
 *               device_id: { type: string, example: "MAIN-001" }
 *               secret_key: { type: string }
 *     responses:
 *       200:
 *         description: Token issued
 */
export const authenticateDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.authenticateDevice(req.body.device_id, req.body.secret_key);
    sendSuccess(res, result, "Device authenticated");
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /device/config/{deviceId}:
 *   get:
 *     tags: [Device]
 *     summary: Fetch device configuration
 *     security:
 *       - DeviceAuth: []
 *       - DeviceSecret: []
 */
export const getDeviceConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const config = await authService.getDeviceConfig(req.params.deviceId);
    sendSuccess(res, config, "Device config");
  } catch (err) {
    next(err);
  }
};
