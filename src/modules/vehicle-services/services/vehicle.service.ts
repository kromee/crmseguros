import type { Prisma } from "@prisma/client";
import { NotFoundError } from "@/core/errors/app-error";
import { prisma } from "@/infrastructure/prisma/client";
import { vehicleRepository } from "../repositories/vehicle.repository";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehiclesFilters,
} from "../schemas/vehicle.schema";

export const vehicleService = {
  async list(filters: VehiclesFilters) {
    return vehicleRepository.list(filters);
  },

  async listByContact(contactId: string) {
    return vehicleRepository.listByContact(contactId);
  },

  async getById(id: string) {
    const v = await vehicleRepository.findById(id);
    if (!v) throw new NotFoundError("Trámite vehicular");
    return v;
  },

  async create(input: CreateVehicleInput, currentUserId: string | null) {
    const created = await vehicleRepository.create(input);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "vehicle_services",
          entityId: created.id,
          action: "CREATE",
          changes: {
            contactId: created.contactId,
            serviceType: created.serviceType,
          } as Prisma.InputJsonValue,
        },
      });
    }
    return created;
  },

  async update(id: string, input: UpdateVehicleInput, currentUserId: string | null) {
    const existing = await vehicleRepository.findById(id);
    if (!existing) throw new NotFoundError("Trámite vehicular");
    const updated = await vehicleRepository.update(id, input);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "vehicle_services",
          entityId: id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue,
        },
      });
    }
    return updated;
  },

  async remove(id: string, currentUserId: string | null) {
    const existing = await vehicleRepository.findById(id);
    if (!existing) throw new NotFoundError("Trámite vehicular");
    await vehicleRepository.delete(id);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "vehicle_services",
          entityId: id,
          action: "DELETE",
          changes: {
            contactId: existing.contactId,
            serviceType: existing.serviceType,
          } as Prisma.InputJsonValue,
        },
      });
    }
  },
};
