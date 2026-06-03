/** Tipos de marca por tenant (seguro para importar en cliente) */
export type TenantBranding = {
  tenantId: string;
  name: string;
  logo: string | null;
  slogan: string | null;
};

export const DEFAULT_TENANT_SLOGAN = "CRM Corporativo";
