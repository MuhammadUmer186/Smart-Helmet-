import { Request, Response, NextFunction } from "express";
import * as authService from "../../services/admin/auth.service";
import { sendSuccess } from "../../utils/response";

/**
 * @swagger
 * /admin/auth/login:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Admin login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.loginAdmin(req.body.email, req.body.password);
    sendSuccess(res, result, "Login successful");
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { admin } = req as any;
    sendSuccess(res, { id: admin.sub, email: admin.email, role: admin.role }, "Profile retrieved");
  } catch (err) {
    next(err);
  }
};
