import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function optionalInt(key: string, fallback: number): number {
  const v = process.env[key];
  return v ? parseInt(v, 10) : fallback;
}

export const env = {
  NODE_ENV: optional("NODE_ENV", "development"),
  PORT: optionalInt("PORT", 3000),
  API_PREFIX: optional("API_PREFIX", "/api"),

  DATABASE_URL: required("DATABASE_URL"),

  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN", "7d"),
  JWT_REFRESH_EXPIRES_IN: optional("JWT_REFRESH_EXPIRES_IN", "30d"),

  DEVICE_TOKEN_SECRET: required("DEVICE_TOKEN_SECRET"),
  DEVICE_TOKEN_EXPIRES_IN: optional("DEVICE_TOKEN_EXPIRES_IN", "24h"),

  CORS_ORIGINS: optional("CORS_ORIGINS", "http://localhost:3000").split(",").map((s) => s.trim()),

  RATE_LIMIT_WINDOW_MS: optionalInt("RATE_LIMIT_WINDOW_MS", 900_000),
  RATE_LIMIT_MAX: optionalInt("RATE_LIMIT_MAX", 100),
  DEVICE_RATE_LIMIT_MAX: optionalInt("DEVICE_RATE_LIMIT_MAX", 500),

  LOG_LEVEL: optional("LOG_LEVEL", "info"),
  LOG_DIR: optional("LOG_DIR", "logs"),

  isProduction: optional("NODE_ENV", "development") === "production",
  isDevelopment: optional("NODE_ENV", "development") === "development",
} as const;
