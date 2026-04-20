import { Router } from "express";
import * as authController from "../../controllers/admin/auth.controller";
import { adminAuth } from "../../middleware/adminAuth";
import { validateBody } from "../../middleware/validate";
import { adminLoginSchema } from "../../validators/admin.validator";
import { authRateLimiter } from "../../middleware/rateLimiter";

const router = Router();

router.post("/login", authRateLimiter, validateBody(adminLoginSchema), authController.login);
router.get("/me", adminAuth as any, authController.me);

export default router;
