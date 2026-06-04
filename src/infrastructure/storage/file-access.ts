const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Logos de agencia visibles en login (sin autenticación) */
export function isPublicBrandingAsset(relativePath: string): boolean {
  return /\/branding\/[^/]+\.(png|jpe?g|webp)$/i.test(relativePath);
}

/**
 * Rutas legacy (contacts/..., policies/...) sin prefijo {tenantId}/.
 * En producción se desactivan por defecto tras migrar uploads.
 */
export function isLegacyUploadPathAllowed(): boolean {
  const explicit = process.env.ALLOW_LEGACY_UPLOAD_PATHS;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env.NODE_ENV !== "production";
}

/**
 * Tenant users solo acceden a archivos bajo su carpeta {tenantId}/...
 * o rutas legacy sin prefijo de tenant (solo si ALLOW_LEGACY_UPLOAD_PATHS lo permite).
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

  return isLegacyUploadPathAllowed();
}
