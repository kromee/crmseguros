const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Tenant users solo acceden a archivos bajo su carpeta {tenantId}/...
 * o rutas legacy sin prefijo de tenant (contacts/..., policies/...).
 */
export function canAccessTenantFile(
  relativePath: string,
  tenantId: string | null | undefined,
  role: string
): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (!tenantId) return false;

  const [firstSegment] = relativePath.split("/");
  if (UUID_SEGMENT.test(firstSegment)) {
    return firstSegment === tenantId;
  }

  return true;
}
