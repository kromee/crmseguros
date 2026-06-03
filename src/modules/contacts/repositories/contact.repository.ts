import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import type {
  ContactsFilters,
  CreateContactInput,
  UpdateContactInput,
} from "../schemas/contact.schema";

export const contactRepository = {
  async findById(tenantId: string, id: string) {
    return prisma.contact.findFirst({
      where: { id, tenantId },
      include: {
        assignedUser: { select: { id: true, name: true, title: true } },
        policies: {
          orderBy: { createdAt: "desc" },
          include: {
            payments: { orderBy: { paymentDate: "desc" } },
            renewedBy: {
              select: { id: true, policyNumber: true, status: true },
            },
          },
        },
        pensionServices: { orderBy: { createdAt: "desc" } },
        vehicleServices: { orderBy: { createdAt: "desc" } },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            performer: { select: { id: true, name: true, title: true } },
          },
        },
      },
    });
  },

  async findByCode(tenantId: string, code: string) {
    return prisma.contact.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
  },

  async list(tenantId: string, filters: ContactsFilters) {
    const where: Prisma.ContactWhereInput = { tenantId };

    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.origin) where.origin = filters.origin;

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { code: { contains: q } },
      ];
    }

    const skip = (filters.page - 1) * filters.pageSize;

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.pageSize,
        include: {
          assignedUser: { select: { id: true, name: true } },
          _count: { select: { policies: true, prospects: true } },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    };
  },

  async countByType(tenantId: string) {
    const rows = await prisma.contact.groupBy({
      by: ["type"],
      where: { tenantId },
      _count: { _all: true },
    });
    return rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = r._count._all;
      return acc;
    }, {});
  },

  /** Clientes nuevos: variación % mes actual vs mes anterior */
  async getMonthlyClientGrowth(tenantId: string) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonth, lastMonth] = await Promise.all([
      prisma.contact.count({
        where: { tenantId, type: "CLIENT", createdAt: { gte: thisMonthStart } },
      }),
      prisma.contact.count({
        where: {
          tenantId,
          type: "CLIENT",
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
    ]);

    if (lastMonth === 0) {
      if (thisMonth === 0) {
        return { label: "0%", detail: "Sin altas de clientes este mes", trend: "flat" as const };
      }
      return {
        label: `${thisMonth}`,
        detail: `cliente${thisMonth !== 1 ? "s" : ""} nuevo${thisMonth !== 1 ? "s" : ""} este mes`,
        trend: "up" as const,
      };
    }

    const pct = ((thisMonth - lastMonth) / lastMonth) * 100;
    const sign = pct > 0 ? "+" : "";
    return {
      label: `${sign}${pct.toFixed(1)}%`,
      detail: `${thisMonth} vs ${lastMonth} el mes pasado`,
      trend: pct > 0 ? ("up" as const) : pct < 0 ? ("down" as const) : ("flat" as const),
    };
  },

  async create(
    tenantId: string,
    input: CreateContactInput,
    code: string,
    assignedTo: string | null
  ) {
    return prisma.contact.create({
      data: {
        tenantId,
        code,
        type: input.type,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email ?? null,
        photo: input.photo ?? null,
        birthDate: input.birthDate,
        activity: input.activity ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        origin: input.origin,
        status: input.status,
        notes: input.notes ?? null,
        assignedTo,
      },
    });
  },

  async update(tenantId: string, id: string, input: UpdateContactInput) {
    return prisma.contact.update({
      where: { id, tenantId },
      data: {
        ...(input.type !== undefined && { type: input.type }),
        ...(input.fullName !== undefined && { fullName: input.fullName }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email ?? null }),
        ...(input.photo !== undefined && { photo: input.photo ?? null }),
        ...(input.birthDate !== undefined && { birthDate: input.birthDate }),
        ...(input.activity !== undefined && { activity: input.activity ?? null }),
        ...(input.city !== undefined && { city: input.city ?? null }),
        ...(input.state !== undefined && { state: input.state ?? null }),
        ...(input.origin !== undefined && { origin: input.origin }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes ?? null }),
      },
    });
  },

  async delete(tenantId: string, id: string) {
    return prisma.contact.delete({ where: { id, tenantId } });
  },

  async nextCodeNumber(tenantId: string) {
    const last = await prisma.contact.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });
    if (!last) return 1000;
    const match = last.code.match(/SM-(\d+)/);
    return match ? Number(match[1]) + 1 : 1000;
  },
};

export type ContactListItem = Awaited<ReturnType<typeof contactRepository.list>>["items"][number];
export type ContactWithRelations = NonNullable<Awaited<ReturnType<typeof contactRepository.findById>>>;
