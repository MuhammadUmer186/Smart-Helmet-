import { prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";

/**
 * Fetch the primary active emergency contact for a device.
 * This endpoint is specifically optimized for embedded ESP32 clients —
 * returns minimal payload suitable for GSM SMS dispatch.
 */
export const getPrimaryContact = async (deviceId: string) => {
  const contact = await prisma.emergencyContact.findFirst({
    where: { device_id: deviceId, is_primary: true, is_active: true },
    select: { id: true, name: true, phone_number: true },
  });

  if (!contact) {
    const fallback = await prisma.emergencyContact.findFirst({
      where: { device_id: deviceId, is_active: true },
      orderBy: { created_at: "asc" },
      select: { id: true, name: true, phone_number: true },
    });

    if (!fallback) {
      throw new AppError("No active emergency contact configured for this device", 404);
    }

    return { ...fallback, is_fallback: true };
  }

  return { ...contact, is_fallback: false };
};
