import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import type {
  ActivitiesFilters,
  CreateActivityInput,
  UpdateActivityInput,
} from "../schemas/activity.schema";

export const activityRepository = {
  async findById(id: string) {
    return prisma.activity.findUnique({
      where: { id },
      include: {
        performer: { select: { id: true, name: true, title: true } },
        contact: { select: { id: true, code: true, fullName: true } },
      },
    });
  },

  async listByContact(contactId: string, type?: string) {
    return prisma.activity.findMany({
      where: {
        contactId,
        ...(type ? { type: type as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        performer: { select: { id: true, name: true, title: true } },
      },
    });
  },

  async list(filters: ActivitiesFilters) {
    const where: Prisma.ActivityWhereInput = {};
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

  async countByContact(contactId: string) {
    const rows = await prisma.activity.groupBy({
      by: ["type"],
      where: { contactId },
      _count: { _all: true },
    });
    const byType = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = r._count._all;
      return acc;
    }, {});
    const total = rows.reduce((sum, r) => sum + r._count._all, 0);
    return { total, byType };
  },

  async create(input: CreateActivityInput, performedBy: string) {
    return prisma.activity.create({
      data: {
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

  async update(id: string, input: UpdateActivityInput) {
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

    return prisma.activity.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.activity.delete({ where: { id } });
  },
};

export type ActivityListItem = Awaited<ReturnType<typeof activityRepository.list>>["items"][number];
export type ContactActivity = Awaited<ReturnType<typeof activityRepository.listByContact>>[number];
