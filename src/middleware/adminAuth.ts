import { Response, NextFunction } from "express";
import { verifyAdminToken } from "../utils/jwt";
import { sendError } from "../utils/response";
import { AuthenticatedAdminRequest } from "../types";
import { prisma } from "../config/database";

export const adminAuth = async (
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      sendError(res, "Missing authorization header", 401, "NO_TOKEN");
      return;
    }

    const token = authHeader.slice(7);
    const payload = verifyAdminToken(token);

    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.sub, is_active: true },
      select: { id: true, email: true, role: true, is_active: true },
    });

    if (!admin) {
      sendError(res, "Account not found or disabled", 401, "INVALID_ADMIN");
      return;
    }

    req.admin = payload;
    next();
  } catch (err) {
    next(err);
  }
};
