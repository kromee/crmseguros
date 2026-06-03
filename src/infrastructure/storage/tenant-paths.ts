/**
 * Rutas de almacenamiento por agencia (tenant).
 * Estructura en disco: uploads/{tenantId}/{categoria}/archivo.ext
 */
export const TENANT_UPLOAD_CATEGORIES = {
  contacts: "contacts",
  policies: "policies",
  policyVehicles: "policies/vehicles",
  users: "users",
  activities: "activities",
  vehicleDocuments: "vehicles/documents",
  branding: "branding",
  general: "general",
} as const;

export type TenantUploadCategory =
  (typeof TENANT_UPLOAD_CATEGORIES)[keyof typeof TENANT_UPLOAD_CATEGORIES];

/** Normaliza categorías legacy (ej. tenants/branding → branding) */
export function normalizeUploadCategory(category: string): string {
  if (category === "tenants/branding") return TENANT_UPLOAD_CATEGORIES.branding;
  return category.replace(/^\/+|\/+$/g, "");
}

/**
 * Ruta relativa bajo uploads/ para un tenant.
 * Sin tenantId conserva la ruta anterior (compatibilidad con archivos legacy).
 */
export function tenantStoragePath(
  tenantId: string | null | undefined,
  category: string
): string {
  const normalized = normalizeUploadCategory(category);
  if (!tenantId) return normalized;
  return `${tenantId}/${normalized}`;
}

/** True si la ruta ya incluye el prefijo del tenant */
export function isTenantScopedPath(relativePath: string, tenantId: string): boolean {
  return relativePath.startsWith(`${tenantId}/`);
}
