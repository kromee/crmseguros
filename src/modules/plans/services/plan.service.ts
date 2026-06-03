import { prisma } from "@/infrastructure/prisma/client";
import {
  SAAS_PLAN_CATALOG,
  toPlanUpsertData,
} from "@/core/tenant/saas-catalog";

export const planService = {
  listActive() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { maxUsers: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        maxUsers: true,
        storageLimitMb: true,
        priceMonthly: true,
      },
    });
  },

  listCatalog() {
    return SAAS_PLAN_CATALOG.filter((p) => p.isActive).sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
  },

  /** Sincroniza catálogo TS → tabla `plans` (idempotente, seguro en producción) */
  async syncCatalog() {
    const results = [];
    for (const plan of SAAS_PLAN_CATALOG) {
      const data = toPlanUpsertData(plan);
      const row = await prisma.plan.upsert({
        where: { slug: plan.slug },
        create: data,
        update: {
          name: data.name,
          maxUsers: data.maxUsers,
          storageLimitMb: data.storageLimitMb,
          priceMonthly: data.priceMonthly,
          isActive: data.isActive,
        },
      });
      results.push(row);
    }
    return results;
  },

  /** @deprecated Usar syncCatalog */
  async ensureCatalog() {
    return this.syncCatalog();
  },
};
