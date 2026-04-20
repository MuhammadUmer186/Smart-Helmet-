import { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
): Response => {
  return res.status(statusCode).json({ success: true, message, data } as ApiResponse<T>);
};

export const sendCreated = <T>(res: Response, data: T, message = "Created"): Response => {
  return sendSuccess(res, data, message, 201);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): Response => {
  return res.status(statusCode).json({ success: false, message, error } as ApiResponse);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message = "Success"
): Response => {
  return res.status(200).json({ success: true, message, data, pagination } as PaginatedResponse<T>);
};

export const buildPagination = (total: number, page: number, limit: number): PaginationMeta => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

export const parsePagination = (
  query: Record<string, unknown>
): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? "20"), 10)));
  return { page, limit, skip: (page - 1) * limit };
};
