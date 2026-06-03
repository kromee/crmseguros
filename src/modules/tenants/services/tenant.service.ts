import { NotFoundError, ValidationError } from "@/core/errors/app-error";
import { expiresAtFromTerm } from "@/core/tenant/license-term";
import { prisma } from "@/infrastructure/prisma/client";
import { tenantRepository } from "../repositories/tenant.repository";
import type {
  ListTenantsInput,
  RenewSubscriptionInput,
  UpdateTenantStatusInput,
} from "../schemas/tenant.schema";

function getCurrentSubscription(tenant: NonNullable<Awaited<ReturnType<typeof tenantRepository.findById>>>) {
  return tenant.subscriptions.find((s) =>
    ["ACTIVE", "SUSPENDED", "TRIAL"].includes(s.status)
  );
}

export const tenantService = {
  list(input: ListTenantsInput) {
    return tenantRepository.list(input);
  },

  async getById(id: string) {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundError("Agencia");
    }
    return tenant;
  },

  async getPlatformStats() {
    const [statusCounts, expiringSoon, licensesAvailable, licensesUsed] = await Promise.all([
      tenantRepository.countByStatus(),
      tenantRepository.countExpiringSoon(30),
      prisma.license.count({ where: { status: "AVAILABLE" } }),
      prisma.license.count({ where: { status: "USED" } }),
    ]);

    const byStatus = Object.fromEntries(
      statusCounts.map((row) => [row.status, row._count._all])
    ) as Record<string, number>;

    return {
      total: statusCounts.reduce((acc, row) => acc + row._count._all, 0),
      active: byStatus.ACTIVE ?? 0,
      suspended: byStatus.SUSPENDED ?? 0,
      pending: byStatus.PENDING ?? 0,
      expiringSoon,
      licensesAvailable,
      licensesUsed,
    };
  },

  async updateStatus(input: UpdateTenantStatusInput, actorUserId: string) {
    const tenant = await tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new NotFoundError("Agencia");
    }

    if (tenant.status === input.status) {
      throw new ValidationError(
        input.status === "SUSPENDED"
          ? "La agencia ya está suspendida"
          : "La agencia ya está activa"
      );
    }

    if (input.status === "ACTIVE") {
      const currentSub = getCurrentSubscription(tenant);
      if (!currentSub) {
        throw new ValidationError("No hay suscripción activa. Renueva antes de reactivar.");
      }
      if (currentSub.expiresAt < new Date()) {
        throw new ValidationError("La suscripción está vencida. Renueva antes de reactivar.");
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tenantRepository.updateStatus(input.tenantId, input.status, tx);

      if (input.status === "SUSPENDED") {
        await tenantRepository.syncSubscriptionStatus(input.tenantId, "SUSPENDED", tx);
      } else {
        await tenantRepository.syncSubscriptionStatus(input.tenantId, "ACTIVE", tx);
      }

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          tenantId: input.tenantId,
          entity: "tenants",
          entityId: input.tenantId,
          action: "UPDATE",
          changes: {
            event: input.status === "SUSPENDED" ? "tenant_suspended" : "tenant_activated",
            previousStatus: tenant.status,
            newStatus: input.status,
          },
        },
      });

      return updated;
    });
  },

  async renewSubscription(input: RenewSubscriptionInput, actorUserId: string) {
    const tenant = await tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new NotFoundError("Agencia");
    }

    const currentSub = getCurrentSubscription(tenant);
    const now = new Date();
    const startsAt =
      currentSub && currentSub.expiresAt > now ? new Date(currentSub.expiresAt) : now;
    const expiresAt = expiresAtFromTerm(startsAt, input.term);

    return prisma.$transaction(async (tx) => {
      await tenantRepository.expireActiveSubscriptions(input.tenantId, tx);

      const subscription = await tenantRepository.createSubscription(
        {
          tenantId: tenant.id,
          planId: tenant.planId,
          term: input.term,
          startsAt,
          expiresAt,
        },
        tx
      );

      if (tenant.status === "SUSPENDED") {
        await tenantRepository.updateStatus(tenant.id, "ACTIVE", tx);
      }

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          tenantId: tenant.id,
          entity: "subscriptions",
          entityId: subscription.id,
          action: "CREATE",
          changes: {
            event: "subscription_renewed",
            term: input.term,
            startsAt,
            expiresAt,
          },
        },
      });

      return { subscription, expiresAt };
    });
  },

  async changePlan(input: { tenantId: string; planId: string }, actorUserId: string) {
    const tenant = await tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new NotFoundError("Agencia");
    }

    if (tenant.planId === input.planId) {
      throw new ValidationError("La agencia ya tiene ese plan asignado");
    }

    const plan = await prisma.plan.findFirst({
      where: { id: input.planId, isActive: true },
    });
    if (!plan) {
      throw new NotFoundError("Plan");
    }

    const activeUsers = await prisma.user.count({
      where: { tenantId: input.tenantId, isActive: true },
    });

    if (activeUsers > plan.maxUsers) {
      throw new ValidationError(
        `No se puede cambiar al plan ${plan.name}: hay ${activeUsers} usuarios activos y el plan permite ${plan.maxUsers}. Desactiva usuarios primero.`
      );
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.tenant.update({
        where: { id: input.tenantId },
        data: {
          planId: plan.id,
          maxUsers: plan.maxUsers,
          storageLimitMb: plan.storageLimitMb,
        },
      });

      const currentSub = getCurrentSubscription(tenant);
      if (currentSub) {
        await tx.subscription.update({
          where: { id: currentSub.id },
          data: { planId: plan.id },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          tenantId: input.tenantId,
          entity: "tenants",
          entityId: input.tenantId,
          action: "UPDATE",
          changes: {
            event: "tenant_plan_changed",
            previousPlanId: tenant.planId,
            newPlanId: plan.id,
            newPlanName: plan.name,
          },
        },
      });

      return updated;
    });
  },
};
