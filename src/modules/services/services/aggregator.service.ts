import { prisma } from "@/infrastructure/prisma/client";

export const servicesAggregator = {
  async getOverview(tenantId: string) {
    const now = new Date();
    const horizon30 = new Date();
    horizon30.setDate(horizon30.getDate() + 30);

    const [
      policiesTotal,
      policiesActive,
      policiesExpiring,
      policiesExpired,
      pensionsTotal,
      pensionsByStatus,
      vehiclesTotal,
      vehiclesByStatus,
    ] = await Promise.all([
      prisma.policy.count({ where: { tenantId } }),
      prisma.policy.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.policy.count({
        where: { tenantId, status: "ACTIVE", endDate: { gte: now, lte: horizon30 } },
      }),
      prisma.policy.count({ where: { tenantId, status: "EXPIRED" } }),
      prisma.pensionService.count({ where: { tenantId } }),
      prisma.pensionService.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.vehicleService.count({ where: { tenantId } }),
      prisma.vehicleService.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { _all: true },
      }),
    ]);

    const pensionsActive = pensionsByStatus
      .filter((g) => g.status === "PENDING" || g.status === "IN_PROGRESS")
      .reduce((acc, g) => acc + g._count._all, 0);

    const vehiclesInProgress = vehiclesByStatus
      .filter((g) => g.status === "PENDING" || g.status === "IN_PROGRESS")
      .reduce((acc, g) => acc + g._count._all, 0);

    return {
      policies: {
        total: policiesTotal,
        active: policiesActive,
        expiring30d: policiesExpiring,
        expired: policiesExpired,
      },
      pensions: {
        total: pensionsTotal,
        active: pensionsActive,
        byStatus: pensionsByStatus.reduce<Record<string, number>>((acc, g) => {
          acc[g.status] = g._count._all;
          return acc;
        }, {}),
      },
      vehicles: {
        total: vehiclesTotal,
        inProgress: vehiclesInProgress,
        byStatus: vehiclesByStatus.reduce<Record<string, number>>((acc, g) => {
          acc[g.status] = g._count._all;
          return acc;
        }, {}),
      },
    };
  },

  async getExpiringPolicies(tenantId: string, days = 30, limit = 5) {
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + days);

    return prisma.policy.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        endDate: { gte: now, lte: horizon },
      },
      orderBy: { endDate: "asc" },
      take: limit,
      include: {
        contact: { select: { id: true, code: true, fullName: true } },
      },
    });
  },
};
