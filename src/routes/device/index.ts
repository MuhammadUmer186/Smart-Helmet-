import { Router } from "express";
import * as authController from "../../controllers/device/auth.controller";
import * as telemetryController from "../../controllers/device/telemetry.controller";
import * as contactController from "../../controllers/device/contact.controller";
import { deviceAuth } from "../../middleware/deviceAuth";
import { validateBody } from "../../middleware/validate";
import {
  deviceAuthSchema,
  telemetrySchema,
  eventSchema,
  locationSchema,
  heartbeatSchema,
} from "../../validators/device.validator";
import { deviceRateLimiter } from "../../middleware/rateLimiter";

const router = Router();

router.use(deviceRateLimiter);

// Public device auth — no middleware required
router.post("/auth", validateBody(deviceAuthSchema), authController.authenticateDevice);

// All routes below require device auth
router.get("/config/:deviceId", deviceAuth as any, authController.getDeviceConfig);
router.get("/:deviceId/contact", deviceAuth as any, contactController.getPrimaryContact as any);
router.post("/telemetry", deviceAuth as any, validateBody(telemetrySchema), telemetryController.submitTelemetry as any);
router.post("/event", deviceAuth as any, validateBody(eventSchema), telemetryController.submitEvent as any);
router.post("/location", deviceAuth as any, validateBody(locationSchema), telemetryController.submitLocation as any);
router.post("/heartbeat", deviceAuth as any, validateBody(heartbeatSchema), telemetryController.submitHeartbeat as any);

export default router;
