import type { SubscriptionStatus, TenantStatus } from "@prisma/client";

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  PENDING: "Pendiente",
  ACTIVE: "Activa",
  SUSPENDED: "Suspendida",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  TRIAL: "Prueba",
  ACTIVE: "Activa",
  EXPIRED: "Vencida",
  CANCELLED: "Cancelada",
  SUSPENDED: "Suspendida",
};
