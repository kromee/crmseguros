import type { UserRole } from "@prisma/client";

export function isSuperAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

export function isTenantAdmin(role: UserRole): boolean {
  return role === "TENANT_ADMIN" || role === "SUPER_ADMIN";
}

export function canManageTenantUsers(role: UserRole): boolean {
  return role === "TENANT_ADMIN";
}
