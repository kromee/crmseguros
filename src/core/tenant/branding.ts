import { prisma } from "@/infrastructure/prisma/client";
import { NotFoundError } from "@/core/errors/app-error";
import type { TenantBranding } from "./branding-types";

export type { TenantBranding } from "./branding-types";
export { DEFAULT_TENANT_SLOGAN } from "./branding-types";

const brandingSelect = {
  id: true,
  name: true,
  logo: true,
  slogan: true,
} as const;

export async function getTenantBranding(tenantId: string): Promise<TenantBranding> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: brandingSelect,
  });
  if (!tenant) {
    throw new NotFoundError("Agencia");
  }
  return {
    tenantId: tenant.id,
    name: tenant.name,
    logo: tenant.logo,
    slogan: tenant.slogan,
  };
}
