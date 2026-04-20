import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";

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
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
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
app.get("/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/docs", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Smart Helmet API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: "/docs.json",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        deepLinking: true,
      });
    };
  </script>
</body>
</html>`);
});

// ── Routes ────────────────────────────────────
app.use(env.API_PREFIX, routes);

// ── Error handling ────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
