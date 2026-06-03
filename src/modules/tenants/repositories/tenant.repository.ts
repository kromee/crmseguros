import type { Prisma, TenantStatus } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import type { ListTenantsInput } from "../schemas/tenant.schema";

const tenantListInclude = {
  plan: { select: { name: true, slug: true, maxUsers: true } },
  subscriptions: {
    where: { status: { in: ["ACTIVE", "SUSPENDED", "TRIAL"] as const } },
    orderBy: { expiresAt: "desc" as const },
    take: 1,
  },
  _count: { select: { users: true } },
} satisfies Prisma.TenantInclude;

export type TenantListItem = Prisma.TenantGetPayload<{
  include: typeof tenantListInclude;
}>;

const tenantDetailInclude = {
  plan: true,
  users: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  },
  subscriptions: {
    orderBy: { createdAt: "desc" as const },
    include: { plan: { select: { name: true } } },
  },
  licenses: {
    orderBy: { usedAt: "desc" as const },
    take: 1,
    select: { code: true, term: true, usedAt: true },
  },
  _count: {
    select: {
      contacts: true,
      policies: true,
      users: true,
    },
  },
} satisfies Prisma.TenantInclude;

export type TenantDetail = Prisma.TenantGetPayload<{
  include: typeof tenantDetailInclude;
}>;

export const tenantRepository = {
  async list(input: ListTenantsInput) {
    const where: Prisma.TenantWhereInput = {};

    if (input.status && input.status !== "ALL") {
      where.status = input.status;
    }

    if (input.q?.trim()) {
      const q = input.q.trim();
      where.OR = [
        { name: { contains: q } },
        { slug: { contains: q } },
      ];
    }

    const skip = (input.page - 1) * input.pageSize;

    const [items, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: input.pageSize,
        include: tenantListInclude,
      }),
      prisma.tenant.count({ where }),
    ]);

    return { items, total, page: input.page, pageSize: input.pageSize };
  },

  findById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      include: tenantDetailInclude,
    });
  },

  countByStatus() {
    return prisma.tenant.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
  },

  countExpiringSoon(days = 30) {
    const until = new Date();
    until.setDate(until.getDate() + days);

    return prisma.subscription.count({
      where: {
        status: "ACTIVE",
        expiresAt: { gte: new Date(), lte: until },
      },
    });
  },

  updateStatus(id: string, status: TenantStatus, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.tenant.update({
      where: { id },
      data: { status },
    });
  },

  syncSubscriptionStatus(
    tenantId: string,
    status: "ACTIVE" | "SUSPENDED",
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;
    return client.subscription.updateMany({
      where: {
        tenantId,
        status: status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
      },
      data: { status },
    });
  },

  expireActiveSubscriptions(tenantId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.subscription.updateMany({
      where: { tenantId, status: { in: ["ACTIVE", "TRIAL", "SUSPENDED"] } },
      data: { status: "EXPIRED" },
    });
  },

  createSubscription(
    data: {
      tenantId: string;
      planId: string;
      term: Prisma.SubscriptionCreateInput["term"];
      startsAt: Date;
      expiresAt: Date;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;
    return client.subscription.create({
      data: {
        tenantId: data.tenantId,
        planId: data.planId,
        term: data.term,
        status: "ACTIVE",
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
      },
    });
  },
};
