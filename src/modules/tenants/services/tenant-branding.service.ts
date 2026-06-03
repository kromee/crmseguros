import { NotFoundError } from "@/core/errors/app-error";
import { deleteFile } from "@/infrastructure/storage/local-storage";
import { prisma } from "@/infrastructure/prisma/client";
import type { UpdateTenantBrandingInput } from "../schemas/tenant-branding.schema";

export const tenantBrandingService = {
  async get(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, logo: true, slogan: true },
    });
    if (!tenant) throw new NotFoundError("Agencia");
    return tenant;
  },

  async update(tenantId: string, input: UpdateTenantBrandingInput, actorUserId: string) {
    const existing = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, logo: true, slogan: true },
    });
    if (!existing) throw new NotFoundError("Agencia");

    if (input.logo !== undefined && existing.logo && input.logo !== existing.logo) {
      await deleteFile(existing.logo);
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: input.name.trim(),
        slogan: input.slogan?.trim() ? input.slogan.trim() : null,
        ...(input.logo !== undefined && { logo: input.logo }),
      },
      select: { id: true, name: true, logo: true, slogan: true },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorUserId,
        entity: "tenants",
        entityId: tenantId,
        action: "UPDATE",
        changes: {
          event: "tenant_branding_updated",
          nameFrom: existing.name,
          nameTo: updated.name,
          sloganUpdated: existing.slogan !== updated.slogan,
          logoUpdated: existing.logo !== updated.logo,
        },
      },
    });

    return updated;
  },

  async removeLogo(tenantId: string, actorUserId: string) {
    const existing = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { logo: true },
    });
    if (!existing) throw new NotFoundError("Agencia");

    if (existing.logo) {
      await deleteFile(existing.logo);
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { logo: null },
      select: { id: true, name: true, logo: true, slogan: true },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorUserId,
        entity: "tenants",
        entityId: tenantId,
        action: "UPDATE",
        changes: { event: "tenant_logo_removed" },
      },
    });

    return updated;
  },
};
