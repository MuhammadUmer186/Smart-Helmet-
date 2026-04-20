import { Router } from "express";
import * as telemetryController from "../../controllers/admin/telemetry.controller";
import { adminAuth } from "../../middleware/adminAuth";

const router = Router();

router.use(adminAuth as any);

router.get("/", telemetryController.listTelemetry);
router.get("/device/:deviceId/latest", telemetryController.getLatestTelemetry);
router.get("/events", telemetryController.listEvents);

export default router;
