import { PrismaClient } from "@prisma/client";
import { env } from "./env";
import { logger } from "../utils/logger";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.isDevelopment
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
          ]
        : [{ emit: "event", level: "error" }],
  });

if (env.isDevelopment) {
  (prisma as any).$on("query", (e: any) => {
    logger.debug(`Query: ${e.query} — ${e.duration}ms`);
  });
}

(prisma as any).$on("error", (e: any) => {
  logger.error(`Prisma error: ${e.message}`);
});

if (!env.isProduction) globalForPrisma.prisma = prisma;

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info("Database connected");
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info("Database disconnected");
}
