import { Router } from "express";
import * as dashboardController from "../../controllers/admin/dashboard.controller";
import { adminAuth } from "../../middleware/adminAuth";

const router = Router();

router.use(adminAuth as any);

router.get("/summary", dashboardController.getDashboardSummary);
router.get("/device-statuses", dashboardController.getDeviceStatuses);
router.get("/map", dashboardController.getMapLocations);

export default router;
