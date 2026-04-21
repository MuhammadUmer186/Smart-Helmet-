import { Router } from "express";
import * as deviceController from "../../controllers/admin/device.controller";
import { adminAuth } from "../../middleware/adminAuth";
import { validateBody } from "../../middleware/validate";
import {
  createMainDeviceSchema,
  updateMainDeviceSchema,
  createHelmetDeviceSchema,
  updateHelmetDeviceSchema,
  pairDevicesSchema,
  updateDeviceConfigSchema,
} from "../../validators/admin.validator";

const router = Router();

router.use(adminAuth as any);

// Main devices
router.post("/main", validateBody(createMainDeviceSchema), deviceController.createMainDevice);
router.get("/main", deviceController.listMainDevices);
router.get("/main/:id", deviceController.getMainDevice);
router.patch("/main/:id", validateBody(updateMainDeviceSchema), deviceController.updateMainDevice);
router.post("/main/:id/rotate-secret", deviceController.rotateDeviceSecret);
router.patch("/main/:id/config", validateBody(updateDeviceConfigSchema), deviceController.updateDeviceConfig);

// Helmet devices
router.post("/helmet", validateBody(createHelmetDeviceSchema), deviceController.createHelmetDevice);
router.get("/helmet", deviceController.listHelmetDevices);

// Relay control
router.post("/main/:id/relay", deviceController.setRelayCommand);
router.get("/main/:id/emergency", deviceController.getEmergencyEvents);

// Pairings
router.post("/pair", validateBody(pairDevicesSchema), deviceController.pairDevices);
router.delete("/pair/:pairingId", deviceController.unpairDevices);

export default router;
