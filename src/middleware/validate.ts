import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validateBody =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };

export const validateQuery =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    req.query = schema.parse(req.query) as typeof req.query;
    next();
  };

export const validateParams =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    req.params = schema.parse(req.params);
    next();
  };
