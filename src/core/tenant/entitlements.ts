import type { SubscriptionStatus, TenantStatus } from "@prisma/client";
import { AppError, ValidationError } from "@/core/errors/app-error";
import { prisma } from "@/infrastructure/prisma/client";
import { bytesToMb, getPathsSizeBytes, getTenantStorageUsedBytes } from "./storage-usage";

const OPERATIONAL_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ["ACTIVE", "TRIAL"];

export type TenantEntitlements = {
  tenantId: string;
  tenantName: string;
  tenantStatus: TenantStatus;
  planName: string;
  maxUsers: number;
  activeUsers: number;
  canAddUser: boolean;
  storageLimitMb: number;
  storageUsedBytes: number;
  storageUsedMb: number;
  storagePercent: number;
  canUpload: boolean;
  subscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionExpiresAt: Date | null;
  daysUntilExpiry: number | null;
  isSubscriptionValid: boolean;
  canOperate: boolean;
  blockReason: string | null;
};

async function syncExpiredSubscription(tenantId: string) {
  const now = new Date();
  await prisma.subscription.updateMany({
    where: {
      tenantId,
      status: { in: ["ACTIVE", "TRIAL", "SUSPENDED"] },
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });
}

async function getCurrentSubscription(tenantId: string) {
  await syncExpiredSubscription(tenantId);

  return prisma.subscription.findFirst({
    where: {
      tenantId,
      status: { in: ["ACTIVE", "TRIAL", "SUSPENDED"] },
    },
    orderBy: { expiresAt: "desc" },
    include: { plan: { select: { name: true } } },
  });
}

function resolveBlockReason(input: {
  tenantStatus: TenantStatus;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionExpiresAt: Date | null;
}): string | null {
  if (input.tenantStatus === "SUSPENDED") {
    return "Tu agencia está suspendida. Contacta a soporte para reactivarla.";
  }
  if (input.tenantStatus === "PENDING") {
    return "Tu agencia aún no está activa.";
  }
  if (!input.subscriptionExpiresAt || input.subscriptionExpiresAt < new Date()) {
    return "Tu suscripción venció. Contacta a soporte para renovar el acceso.";
  }
  if (input.subscriptionStatus === "SUSPENDED") {
    return "La suscripción está suspendida.";
  }
  if (
    input.subscriptionStatus &&
    !OPERATIONAL_SUBSCRIPTION_STATUSES.includes(input.subscriptionStatus)
  ) {
    return "No hay una suscripción vigente.";
  }
  return null;
}

export async function getTenantEntitlements(tenantId: string): Promise<TenantEntitlements> {
  const [tenant, activeUsers, storageUsedBytes, subscription] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: { select: { name: true } } },
    }),
    prisma.user.count({ where: { tenantId, isActive: true } }),
    getTenantStorageUsedBytes(tenantId),
    getCurrentSubscription(tenantId),
  ]);

  if (!tenant) {
    throw new AppError("Agencia no encontrada", 404);
  }

  const storageLimitMb = tenant.storageLimitMb;
  const storageLimitBytes = storageLimitMb * 1024 * 1024;
  const storageUsedMb = bytesToMb(storageUsedBytes);
  const storagePercent =
    storageLimitBytes > 0 ? Math.min(100, Math.round((storageUsedBytes / storageLimitBytes) * 100)) : 0;

  const subscriptionExpiresAt = subscription?.expiresAt ?? null;
  const subscriptionStatus = subscription?.status ?? null;
  const isSubscriptionValid =
    tenant.status === "ACTIVE" &&
    subscriptionExpiresAt !== null &&
    subscriptionExpiresAt > new Date() &&
    subscriptionStatus !== null &&
    OPERATIONAL_SUBSCRIPTION_STATUSES.includes(subscriptionStatus);

  const blockReason = resolveBlockReason({
    tenantStatus: tenant.status,
    subscriptionStatus,
    subscriptionExpiresAt,
  });

  const daysUntilExpiry = subscriptionExpiresAt
    ? Math.ceil((subscriptionExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantStatus: tenant.status,
    planName: tenant.plan.name,
    maxUsers: tenant.maxUsers,
    activeUsers,
    canAddUser: activeUsers < tenant.maxUsers,
    storageLimitMb,
    storageUsedBytes,
    storageUsedMb,
    storagePercent,
    canUpload: storageUsedBytes < storageLimitBytes && isSubscriptionValid,
    subscriptionId: subscription?.id ?? null,
    subscriptionStatus,
    subscriptionExpiresAt,
    daysUntilExpiry,
    isSubscriptionValid,
    canOperate: blockReason === null,
    blockReason,
  };
}

export async function assertTenantCanOperate(tenantId: string): Promise<TenantEntitlements> {
  const entitlements = await getTenantEntitlements(tenantId);
  if (!entitlements.canOperate) {
    throw new AppError(entitlements.blockReason ?? "Acceso bloqueado", 403);
  }
  return entitlements;
}

export async function assertCanAddUser(tenantId: string): Promise<void> {
  const entitlements = await assertTenantCanOperate(tenantId);
  if (!entitlements.canAddUser) {
    throw new ValidationError(
      `Límite de usuarios alcanzado (${entitlements.activeUsers}/${entitlements.maxUsers}). Desactiva un usuario o contacta soporte.`
    );
  }
}

export async function assertCanUpload(
  tenantId: string,
  fileSizeBytes: number,
  replacingPaths: string[] = []
): Promise<void> {
  const entitlements = await assertTenantCanOperate(tenantId);
  const replacingBytes = await getPathsSizeBytes(replacingPaths);
  const projected = entitlements.storageUsedBytes - replacingBytes + fileSizeBytes;
  const limitBytes = entitlements.storageLimitMb * 1024 * 1024;

  if (projected > limitBytes) {
    throw new ValidationError(
      `Almacenamiento lleno (${entitlements.storageUsedMb}/${entitlements.storageLimitMb} MB). Elimina archivos o contacta soporte.`
    );
  }
}
