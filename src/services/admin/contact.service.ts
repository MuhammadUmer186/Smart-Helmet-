import { prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";

export const createContact = async (data: {
  device_id: string;
  name: string;
  phone_number: string;
  is_primary?: boolean;
  is_active?: boolean;
  notes?: string;
}) => {
  const device = await prisma.mainDevice.findUnique({ where: { id: data.device_id } });
  if (!device) throw new AppError("Device not found", 404);

  if (data.is_primary) {
    await prisma.emergencyContact.updateMany({
      where: { device_id: data.device_id, is_primary: true },
      data: { is_primary: false },
    });
  }

  return prisma.emergencyContact.create({ data });
};

export const listContacts = async (deviceId: string) => {
  const device = await prisma.mainDevice.findUnique({ where: { id: deviceId } });
  if (!device) throw new AppError("Device not found", 404);

  return prisma.emergencyContact.findMany({
    where: { device_id: deviceId },
    orderBy: [{ is_primary: "desc" }, { created_at: "asc" }],
  });
};

export const getContact = async (id: string) => {
  const contact = await prisma.emergencyContact.findUnique({ where: { id } });
  if (!contact) throw new AppError("Contact not found", 404);
  return contact;
};

export const updateContact = async (
  id: string,
  data: { name?: string; phone_number?: string; is_primary?: boolean; is_active?: boolean; notes?: string }
) => {
  const contact = await prisma.emergencyContact.findUnique({ where: { id } });
  if (!contact) throw new AppError("Contact not found", 404);

  if (data.is_primary === true) {
    await prisma.emergencyContact.updateMany({
      where: { device_id: contact.device_id, is_primary: true, id: { not: id } },
      data: { is_primary: false },
    });
  }

  return prisma.emergencyContact.update({ where: { id }, data });
};

export const deleteContact = async (id: string) => {
  const contact = await prisma.emergencyContact.findUnique({ where: { id } });
  if (!contact) throw new AppError("Contact not found", 404);
  return prisma.emergencyContact.delete({ where: { id } });
};
