import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { sendError } from "../utils/response";

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, "Too many requests, please try again later", 429, "RATE_LIMITED");
  },
});

export const deviceRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.DEVICE_RATE_LIMIT_MAX,
  keyGenerator: (req) =>
    (req.headers["x-device-id"] as string) ?? req.ip ?? "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, "Device sending too many requests", 429, "DEVICE_RATE_LIMITED");
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, "Too many login attempts, please try again after 15 minutes", 429, "AUTH_RATE_LIMITED");
  },
});
