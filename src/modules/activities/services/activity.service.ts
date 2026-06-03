import type { Prisma } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import { prisma } from "@/infrastructure/prisma/client";
import { activityRepository } from "../repositories/activity.repository";
import type {
  ActivitiesFilters,
  CreateActivityInput,
  UpdateActivityInput,
} from "../schemas/activity.schema";

export const activityService = {
  async list(tenantId: string, filters: ActivitiesFilters) {
    return activityRepository.list(tenantId, filters);
  },

  async listByContact(tenantId: string, contactId: string, type?: string) {
    return activityRepository.listByContact(tenantId, contactId, type);
  },

  async countByContact(tenantId: string, contactId: string) {
    return activityRepository.countByContact(tenantId, contactId);
  },

  async getById(tenantId: string, id: string) {
    const activity = await activityRepository.findById(tenantId, id);
    if (!activity) throw new NotFoundError("Actividad");
    return activity;
  },

  async create(
    tenantId: string,
    input: CreateActivityInput,
    performedBy: string
  ) {
    const created = await activityRepository.create(tenantId, input, performedBy);
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: performedBy,
        entity: "activities",
        entityId: created.id,
        action: "CREATE",
        changes: {
          contactId: created.contactId,
          type: created.type,
        } as Prisma.InputJsonValue,
      },
    });
    return created;
  },

  async update(
    tenantId: string,
    id: string,
    input: UpdateActivityInput,
    currentUserId: string,
    isAdmin: boolean
  ) {
    const existing = await activityRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Actividad");
    if (!isAdmin && existing.performedBy !== currentUserId) {
      throw new ForbiddenError();
    }

    const updated = await activityRepository.update(tenantId, id, input);
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUserId,
        entity: "activities",
        entityId: id,
        action: "UPDATE",
        changes: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue,
      },
    });
    return updated;
  },

  async remove(
    tenantId: string,
    id: string,
    currentUserId: string,
    isAdmin: boolean
  ) {
    const existing = await activityRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Actividad");
    if (!isAdmin && existing.performedBy !== currentUserId) {
      throw new ForbiddenError();
    }

    await activityRepository.delete(tenantId, id);
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUserId,
        entity: "activities",
        entityId: id,
        action: "DELETE",
        changes: {
          contactId: existing.contactId,
          type: existing.type,
        } as Prisma.InputJsonValue,
      },
    });
  },
};
