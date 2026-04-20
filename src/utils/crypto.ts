import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateSecretKey = (length = 32): string => {
  return crypto.randomBytes(length).toString("hex");
};

export const generateDeviceId = (prefix = "DEV"): string => {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${rand}`;
};

export const compareSecretKey = (plain: string, stored: string): boolean => {
  if (plain.length !== stored.length) return false;
  return crypto.timingSafeEqual(Buffer.from(plain), Buffer.from(stored));
};
