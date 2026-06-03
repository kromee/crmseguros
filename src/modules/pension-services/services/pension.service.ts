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
  async list(tenantId: string, filters: PensionsFilters) {
    return pensionRepository.list(tenantId, filters);
  },

  async listByContact(tenantId: string, contactId: string) {
    return pensionRepository.listByContact(tenantId, contactId);
  },

  async getById(tenantId: string, id: string) {
    const p = await pensionRepository.findById(tenantId, id);
    if (!p) throw new NotFoundError("Servicio de pensión");
    return p;
  },

  async create(
    tenantId: string,
    input: CreatePensionInput,
    currentUserId: string | null
  ) {
    const created = await pensionRepository.create(tenantId, input);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
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

  async update(
    tenantId: string,
    id: string,
    input: UpdatePensionInput,
    currentUserId: string | null
  ) {
    const existing = await pensionRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Servicio de pensión");
    const updated = await pensionRepository.update(tenantId, id, input);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
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

  async remove(tenantId: string, id: string, currentUserId: string | null) {
    const existing = await pensionRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Servicio de pensión");
    await pensionRepository.delete(tenantId, id);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
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
