import type { Prisma } from "@prisma/client";
import { NotFoundError } from "@/core/errors/app-error";
import { prisma } from "@/infrastructure/prisma/client";
import { pensionRepository } from "../repositories/pension.repository";
import type {
  CreatePensionInput,
  PensionsFilters,
  UpdatePensionInput,
} from "../schemas/pension.schema";

export const pensionService = {
  async list(filters: PensionsFilters) {
    return pensionRepository.list(filters);
  },

  async listByContact(contactId: string) {
    return pensionRepository.listByContact(contactId);
  },

  async getById(id: string) {
    const p = await pensionRepository.findById(id);
    if (!p) throw new NotFoundError("Servicio de pensión");
    return p;
  },

  async create(input: CreatePensionInput, currentUserId: string | null) {
    const created = await pensionRepository.create(input);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "pension_services",
          entityId: created.id,
          action: "CREATE",
          changes: { contactId: created.contactId } as Prisma.InputJsonValue,
        },
      });
    }
    return created;
  },

  async update(id: string, input: UpdatePensionInput, currentUserId: string | null) {
    const existing = await pensionRepository.findById(id);
    if (!existing) throw new NotFoundError("Servicio de pensión");
    const updated = await pensionRepository.update(id, input);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "pension_services",
          entityId: id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue,
        },
      });
    }
    return updated;
  },

  async remove(id: string, currentUserId: string | null) {
    const existing = await pensionRepository.findById(id);
    if (!existing) throw new NotFoundError("Servicio de pensión");
    await pensionRepository.delete(id);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "pension_services",
          entityId: id,
          action: "DELETE",
          changes: { contactId: existing.contactId } as Prisma.InputJsonValue,
        },
      });
    }
  },
};
