import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Smart Helmet IoT Backend API",
      version: "1.0.0",
      description:
        "Production REST API for Smart Helmet + Bike Safety IoT System. Supports ESP32 device communication and admin management.",
      contact: { name: "Smart Helmet API", email: "admin@smarthelmet.local" },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
        description: "Local development",
      },
      {
        url: `https://your-domain.com${env.API_PREFIX}`,
        description: "Production",
      },
    ],
    components: {
      securitySchemes: {
        AdminBearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for admin endpoints",
        },
        DeviceAuth: {
          type: "apiKey",
          in: "header",
          name: "x-device-id",
          description: "Device ID header (use with x-device-secret)",
        },
        DeviceSecret: {
          type: "apiKey",
          in: "header",
          name: "x-device-secret",
          description: "Device secret key header",
        },
        DeviceTokenAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Short-lived device JWT token",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array", items: {} },
            pagination: {
              type: "object",
              properties: {
                total: { type: "integer" },
                page: { type: "integer" },
                limit: { type: "integer" },
                totalPages: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
