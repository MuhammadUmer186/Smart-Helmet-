import { Request, Response, NextFunction } from "express";
import * as deviceService from "../../services/admin/device.service";
import { sendSuccess, sendCreated, sendPaginated, buildPagination, parsePagination } from "../../utils/response";

export const createMainDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const device = await deviceService.createMainDevice(req.body);
    sendCreated(res, device, "Main device registered. Store the secret_key — it will not be shown again.");
  } catch (err) { next(err); }
};

export const listMainDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { devices, total } = await deviceService.listMainDevices(skip, limit);
    sendPaginated(res, devices, buildPagination(total, page, limit));
  } catch (err) { next(err); }
};

export const getMainDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const device = await deviceService.getMainDevice(req.params.id);
    sendSuccess(res, device);
  } catch (err) { next(err); }
};

export const updateMainDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const device = await deviceService.updateMainDevice(req.params.id, req.body);
    sendSuccess(res, device, "Device updated");
  } catch (err) { next(err); }
};

export const rotateDeviceSecret = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await deviceService.rotateDeviceSecret(req.params.id);
    sendSuccess(res, result, "Secret rotated. Store the new secret_key — it will not be shown again.");
  } catch (err) { next(err); }
};

export const createHelmetDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const device = await deviceService.createHelmetDevice(req.body);
    sendCreated(res, device, "Helmet device registered");
  } catch (err) { next(err); }
};

export const listHelmetDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { devices, total } = await deviceService.listHelmetDevices(skip, limit);
    sendPaginated(res, devices, buildPagination(total, page, limit));
  } catch (err) { next(err); }
};

export const pairDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pairing = await deviceService.pairDevices(req.body.main_device_id, req.body.helmet_device_id);
    sendCreated(res, pairing, "Devices paired successfully");
  } catch (err) { next(err); }
};

export const unpairDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await deviceService.unpairDevices(req.params.pairingId);
    sendSuccess(res, null, "Devices unpaired");
  } catch (err) { next(err); }
};

export const updateDeviceConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const config = await deviceService.updateDeviceConfig(req.params.id, req.body);
    sendSuccess(res, config, "Device config updated");
  } catch (err) { next(err); }
};
