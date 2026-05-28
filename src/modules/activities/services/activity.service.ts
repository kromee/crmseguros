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
  async list(filters: ActivitiesFilters) {
    return activityRepository.list(filters);
  },

  async listByContact(contactId: string, type?: string) {
    return activityRepository.listByContact(contactId, type);
  },

  async countByContact(contactId: string) {
    return activityRepository.countByContact(contactId);
  },

  async getById(id: string) {
    const activity = await activityRepository.findById(id);
    if (!activity) throw new NotFoundError("Actividad");
    return activity;
  },

  async create(input: CreateActivityInput, performedBy: string) {
    const created = await activityRepository.create(input, performedBy);
    await prisma.auditLog.create({
      data: {
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
    id: string,
    input: UpdateActivityInput,
    currentUserId: string,
    isAdmin: boolean
  ) {
    const existing = await activityRepository.findById(id);
    if (!existing) throw new NotFoundError("Actividad");
    if (!isAdmin && existing.performedBy !== currentUserId) {
      throw new ForbiddenError();
    }

    const updated = await activityRepository.update(id, input);
    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        entity: "activities",
        entityId: id,
        action: "UPDATE",
        changes: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue,
      },
    });
    return updated;
  },

  async remove(id: string, currentUserId: string, isAdmin: boolean) {
    const existing = await activityRepository.findById(id);
    if (!existing) throw new NotFoundError("Actividad");
    if (!isAdmin && existing.performedBy !== currentUserId) {
      throw new ForbiddenError();
    }

    await activityRepository.delete(id);
    await prisma.auditLog.create({
      data: {
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
