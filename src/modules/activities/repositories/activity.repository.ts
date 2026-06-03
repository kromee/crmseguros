import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import type {
  ActivitiesFilters,
  CreateActivityInput,
  UpdateActivityInput,
} from "../schemas/activity.schema";

export const activityRepository = {
  async findById(tenantId: string, id: string) {
    return prisma.activity.findFirst({
      where: { id, tenantId },
      include: {
        performer: { select: { id: true, name: true, title: true } },
        contact: { select: { id: true, code: true, fullName: true } },
      },
    });
  },

  async listByContact(tenantId: string, contactId: string, type?: string) {
    return prisma.activity.findMany({
      where: {
        tenantId,
        contactId,
        ...(type ? { type: type as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        performer: { select: { id: true, name: true, title: true } },
      },
    });
  },

  async list(tenantId: string, filters: ActivitiesFilters) {
    const where: Prisma.ActivityWhereInput = { tenantId };
    if (filters.contactId) where.contactId = filters.contactId;
    if (filters.prospectId) where.prospectId = filters.prospectId;
    if (filters.type) where.type = filters.type;
    if (filters.result) where.result = filters.result;
    if (filters.search?.trim()) {
      where.summary = { contains: filters.search.trim() };
    }

    const skip = (filters.page - 1) * filters.pageSize;
    const [items, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.pageSize,
        include: {
          performer: { select: { id: true, name: true, title: true } },
          contact: { select: { id: true, code: true, fullName: true } },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    };
  },

  async countByContact(tenantId: string, contactId: string) {
    const rows = await prisma.activity.groupBy({
      by: ["type"],
      where: { tenantId, contactId },
      _count: { _all: true },
    });
    const byType = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = r._count._all;
      return acc;
    }, {});
    const total = rows.reduce((sum, r) => sum + r._count._all, 0);
    return { total, byType };
  },

  async create(
    tenantId: string,
    input: CreateActivityInput,
    performedBy: string
  ) {
    return prisma.activity.create({
      data: {
        tenantId,
        contactId: input.contactId,
        prospectId: input.prospectId ?? null,
        policyId: input.policyId ?? null,
        type: input.type,
        summary: input.summary,
        result: input.result,
        isAutomatic: input.isAutomatic,
        attachments:
          input.attachments && input.attachments.length > 0
            ? (input.attachments as Prisma.InputJsonValue)
            : undefined,
        performedBy,
      },
    });
  },

  async update(tenantId: string, id: string, input: UpdateActivityInput) {
    const data: Prisma.ActivityUncheckedUpdateInput = {};
    if (input.type !== undefined) data.type = input.type;
    if (input.summary !== undefined) data.summary = input.summary;
    if (input.result !== undefined) data.result = input.result;
    if (input.prospectId !== undefined) data.prospectId = input.prospectId ?? null;
    if (input.policyId !== undefined) data.policyId = input.policyId ?? null;
    if (input.attachments !== undefined) {
      data.attachments =
        input.attachments && input.attachments.length > 0
          ? (input.attachments as Prisma.InputJsonValue)
          : Prisma.JsonNull;
    }

    return prisma.activity.update({ where: { id, tenantId }, data });
  },

  async delete(tenantId: string, id: string) {
    return prisma.activity.delete({ where: { id, tenantId } });
  },
};

export type ActivityListItem = Awaited<ReturnType<typeof activityRepository.list>>["items"][number];
export type ContactActivity = Awaited<ReturnType<typeof activityRepository.listByContact>>[number];
