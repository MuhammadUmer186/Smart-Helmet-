import { Router } from "express";
import adminAuthRoutes from "./admin/auth.routes";
import adminDeviceRoutes from "./admin/device.routes";
import adminContactRoutes from "./admin/contact.routes";
import adminTelemetryRoutes from "./admin/telemetry.routes";
import adminDashboardRoutes from "./admin/dashboard.routes";
import deviceRoutes from "./device/index";

const router = Router();

// ── Admin routes ─────────────────────────────
router.use("/admin/auth", adminAuthRoutes);
router.use("/admin/devices", adminDeviceRoutes);
router.use("/admin/contacts", adminContactRoutes);
router.use("/admin/telemetry", adminTelemetryRoutes);
router.use("/admin/dashboard", adminDashboardRoutes);

// ── Device routes ────────────────────────────
router.use("/device", deviceRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Smart Helmet Backend is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

export default router;
