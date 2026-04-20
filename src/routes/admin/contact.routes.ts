import { Router } from "express";
import * as contactController from "../../controllers/admin/contact.controller";
import { adminAuth } from "../../middleware/adminAuth";
import { validateBody } from "../../middleware/validate";
import { createContactSchema, updateContactSchema } from "../../validators/admin.validator";

const router = Router();

router.use(adminAuth as any);

router.post("/", validateBody(createContactSchema), contactController.createContact);
router.get("/device/:deviceId", contactController.listContacts);
router.get("/:id", contactController.getContact);
router.patch("/:id", validateBody(updateContactSchema), contactController.updateContact);
router.delete("/:id", contactController.deleteContact);

export default router;
