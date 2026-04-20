import app from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { logger } from "./utils/logger";

const server = app.listen(env.PORT, async () => {
  try {
    await connectDatabase();
    logger.info(`🪖  Smart Helmet Backend running on port ${env.PORT}`);
    logger.info(`📖  API docs: http://localhost:${env.PORT}/docs`);
    logger.info(`🔧  Environment: ${env.NODE_ENV}`);
  } catch (err) {
    logger.error("Failed to connect to database", err);
    process.exit(1);
  }
});

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully…`);
  server.close(async () => {
    await disconnectDatabase();
    logger.info("Server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", reason);
  process.exit(1);
});

export default server;
