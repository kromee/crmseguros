import { auth } from "@/auth";
import { AppError } from "@/core/errors/app-error";
import { assertTenantCanOperate } from "@/core/tenant/entitlements";
import type { UserRole } from "@prisma/client";
import { isSuperAdmin } from "./roles";

export type TenantSession = {
  userId: string;
  role: UserRole;
  tenantId: string;
  email: string;
};

export type AppSession = {
  userId: string;
  role: UserRole;
  tenantId: string | null;
  email: string;
};

/** Sesión autenticada (incluye SUPER_ADMIN sin tenant) */
export async function requireAppSession(): Promise<AppSession> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("No autorizado", 401);
  }
  return {
    userId: session.user.id,
    role: session.user.role,
    tenantId: session.user.tenantId ?? null,
    email: session.user.email ?? "",
  };
}

/** Sesión con tenant obligatorio (rutas CRM de una agencia) */
export async function requireTenantSession(): Promise<TenantSession> {
  const app = await requireAppSession();
  if (!app.tenantId) {
    throw new AppError("Acceso restringido a operadores de agencia", 403);
  }
  await assertTenantCanOperate(app.tenantId);
  return {
    userId: app.userId,
    role: app.role,
    tenantId: app.tenantId,
    email: app.email,
  };
}

export async function requireTenantAdminSession(): Promise<TenantSession> {
  const tenant = await requireTenantSession();
  if (tenant.role !== "TENANT_ADMIN" && !isSuperAdmin(tenant.role)) {
    throw new AppError("Solo un administrador puede realizar esta acción", 403);
  }
  return tenant;
}

/** Panel de plataforma SaaS (sin tenant) */
export async function requireSuperAdminSession(): Promise<AppSession> {
  const app = await requireAppSession();
  if (!isSuperAdmin(app.role)) {
    throw new AppError("Acceso restringido a super administrador", 403);
  }
  return app;
}
