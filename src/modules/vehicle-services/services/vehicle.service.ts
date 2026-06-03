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
  async list(tenantId: string, filters: VehiclesFilters) {
    return vehicleRepository.list(tenantId, filters);
  },

  async listByContact(tenantId: string, contactId: string) {
    return vehicleRepository.listByContact(tenantId, contactId);
  },

  async getById(tenantId: string, id: string) {
    const v = await vehicleRepository.findById(tenantId, id);
    if (!v) throw new NotFoundError("Trámite vehicular");
    return v;
  },

  async create(
    tenantId: string,
    input: CreateVehicleInput,
    currentUserId: string | null
  ) {
    const created = await vehicleRepository.create(tenantId, input);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
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

  async update(
    tenantId: string,
    id: string,
    input: UpdateVehicleInput,
    currentUserId: string | null
  ) {
    const existing = await vehicleRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Trámite vehicular");
    const updated = await vehicleRepository.update(tenantId, id, input);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
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

  async remove(tenantId: string, id: string, currentUserId: string | null) {
    const existing = await vehicleRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Trámite vehicular");
    await vehicleRepository.delete(tenantId, id);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
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
