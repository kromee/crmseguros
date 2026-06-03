import { NotFoundError } from "@/core/errors/app-error";
import {
  defaultCatalogSettings,
  parseCatalogSettings,
  type TenantCatalogSettings,
} from "@/core/tenant/catalog-settings";
import { prisma } from "@/infrastructure/prisma/client";

export const tenantCatalogService = {
  async get(tenantId: string): Promise<TenantCatalogSettings> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { catalogSettings: true },
    });
    if (!tenant) throw new NotFoundError("Agencia");
    return parseCatalogSettings(tenant.catalogSettings);
  },

  async update(
    tenantId: string,
    settings: TenantCatalogSettings,
    actorUserId: string
  ): Promise<TenantCatalogSettings> {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundError("Agencia");

    const normalized = parseCatalogSettings(settings);

    await prisma.$transaction([
      prisma.tenant.update({
        where: { id: tenantId },
        data: { catalogSettings: normalized },
      }),
      prisma.auditLog.create({
        data: {
          tenantId,
          userId: actorUserId,
          entity: "tenants",
          entityId: tenantId,
          action: "UPDATE",
          changes: { event: "catalog_settings_updated" },
        },
      }),
    ]);

    return normalized;
  },

  defaultCatalogSettings,
};
