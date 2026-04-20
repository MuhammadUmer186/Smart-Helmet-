import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { logger } from "./utils/logger";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { notFound, errorHandler } from "./middleware/errorHandler";
import routes from "./routes/index";

const app = express();

// ── Security ──────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: env.isProduction,
    crossOriginEmbedderPolicy: env.isProduction,
  })
);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || env.CORS_ORIGINS.includes(origin) || env.isDevelopment) {
        cb(null, true);
      } else {
        cb(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-device-id", "x-device-secret"],
  })
);

// ── Body parsing ──────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(compression());

// ── Logging ───────────────────────────────────
app.use(
  morgan(env.isDevelopment ? "dev" : "combined", {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.url === `${env.API_PREFIX}/health`,
  })
);

// ── Rate limiting ─────────────────────────────
app.use(env.API_PREFIX, globalRateLimiter);

// ── Swagger docs ──────────────────────────────
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCssUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui.min.css",
    customSiteTitle: "Smart Helmet API Docs",
    swaggerOptions: { persistAuthorization: true },
  })
);

app.get("/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ── Routes ────────────────────────────────────
app.use(env.API_PREFIX, routes);

// ── Error handling ────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
