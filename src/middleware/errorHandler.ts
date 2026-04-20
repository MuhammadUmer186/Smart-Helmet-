import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { logger } from "../utils/logger";
import { sendError } from "../utils/response";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    sendError(res, `Validation failed: ${details}`, 422, "VALIDATION_ERROR");
    return;
  }

  if (err instanceof TokenExpiredError) {
    sendError(res, "Token has expired", 401, "TOKEN_EXPIRED");
    return;
  }

  if (err instanceof JsonWebTokenError) {
    sendError(res, "Invalid token", 401, "INVALID_TOKEN");
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const fields = (err.meta?.target as string[])?.join(", ") ?? "field";
      sendError(res, `Duplicate value for: ${fields}`, 409, "DUPLICATE_ENTRY");
      return;
    }
    if (err.code === "P2025") {
      sendError(res, "Record not found", 404, "NOT_FOUND");
      return;
    }
    sendError(res, "Database error", 500, err.code);
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, "Invalid data provided", 422, "PRISMA_VALIDATION");
    return;
  }

  sendError(res, "Internal server error", 500, "INTERNAL_ERROR");
};
