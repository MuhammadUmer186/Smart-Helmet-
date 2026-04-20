import { Request, Response, NextFunction } from "express";
import * as contactService from "../../services/admin/contact.service";
import { sendSuccess, sendCreated } from "../../utils/response";

export const createContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contact = await contactService.createContact(req.body);
    sendCreated(res, contact, "Emergency contact created");
  } catch (err) { next(err); }
};

export const listContacts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contacts = await contactService.listContacts(req.params.deviceId);
    sendSuccess(res, contacts);
  } catch (err) { next(err); }
};

export const getContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contact = await contactService.getContact(req.params.id);
    sendSuccess(res, contact);
  } catch (err) { next(err); }
};

export const updateContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contact = await contactService.updateContact(req.params.id, req.body);
    sendSuccess(res, contact, "Contact updated");
  } catch (err) { next(err); }
};

export const deleteContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await contactService.deleteContact(req.params.id);
    sendSuccess(res, null, "Contact deleted");
  } catch (err) { next(err); }
};
