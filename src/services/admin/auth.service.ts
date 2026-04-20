import { prisma } from "../../config/database";
import { comparePassword, hashPassword } from "../../utils/crypto";
import { signAdminToken } from "../../utils/jwt";
import { AppError } from "../../middleware/errorHandler";

export const loginAdmin = async (email: string, password: string) => {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.is_active) throw new AppError("Invalid credentials", 401);

  const valid = await comparePassword(password, admin.password);
  if (!valid) throw new AppError("Invalid credentials", 401);

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { last_login: new Date() },
  });

  const token = signAdminToken({ sub: admin.id, email: admin.email, role: admin.role });

  return {
    token,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  };
};

export const createAdminUser = async (email: string, password: string, name: string) => {
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) throw new AppError("Email already registered", 409);

  const hashed = await hashPassword(password);
  return prisma.adminUser.create({
    data: { email, password: hashed, name },
    select: { id: true, email: true, name: true, role: true, created_at: true },
  });
};
