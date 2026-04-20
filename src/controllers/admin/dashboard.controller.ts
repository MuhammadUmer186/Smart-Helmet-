import { Request, Response, NextFunction } from "express";
import * as dashboardService from "../../services/admin/dashboard.service";
import { sendSuccess } from "../../utils/response";

export const getDashboardSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await dashboardService.getDashboardSummary();
    sendSuccess(res, summary, "Dashboard summary");
  } catch (err) { next(err); }
};

export const getDeviceStatuses = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const statuses = await dashboardService.getDeviceStatuses();
    sendSuccess(res, statuses, "Device statuses");
  } catch (err) { next(err); }
};

export const getMapLocations = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locations = await dashboardService.getMapLocations();
    sendSuccess(res, locations, "Map locations");
  } catch (err) { next(err); }
};
