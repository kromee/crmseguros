"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/core/errors/app-error";
import type { ActionResult } from "@/core/types/action-result";
import { requireSuperAdminSession } from "@/core/tenant/session";
import {
  listTenantsSchema,
  renewSubscriptionSchema,
  updateTenantStatusSchema,
  changeTenantPlanSchema,
  type ListTenantsInput,
  type RenewSubscriptionInput,
  type UpdateTenantStatusInput,
  type ChangeTenantPlanInput,
} from "../schemas/tenant.schema";
import { tenantService } from "../services/tenant.service";

export async function listTenantsAction(input: ListTenantsInput) {
  await requireSuperAdminSession();
  const parsed = listTenantsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Parámetros inválidos", items: [], total: 0 };
  }
  return tenantService.list(parsed.data);
}

export async function updateTenantStatusAction(
  input: UpdateTenantStatusInput
): Promise<ActionResult<{ status: string }>> {
  try {
    const session = await requireSuperAdminSession();
    const parsed = updateTenantStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Datos inválidos" };
    }

    const tenant = await tenantService.updateStatus(parsed.data, session.userId);
    revalidatePath("/platform");
    revalidatePath("/platform/tenants");
    revalidatePath(`/platform/tenants/${parsed.data.tenantId}`);

    return { ok: true, data: { status: tenant.status } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo actualizar la agencia",
    };
  }
}

export async function renewSubscriptionAction(
  input: RenewSubscriptionInput
): Promise<ActionResult<{ expiresAt: string }>> {
  try {
    const session = await requireSuperAdminSession();
    const parsed = renewSubscriptionSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Datos inválidos" };
    }

    const { expiresAt } = await tenantService.renewSubscription(parsed.data, session.userId);
    revalidatePath("/platform");
    revalidatePath("/platform/tenants");
    revalidatePath(`/platform/tenants/${parsed.data.tenantId}`);

    return { ok: true, data: { expiresAt: expiresAt.toISOString() } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo renovar la suscripción",
    };
  }
}

export async function changeTenantPlanAction(
  input: ChangeTenantPlanInput
): Promise<ActionResult<{ planId: string }>> {
  try {
    const session = await requireSuperAdminSession();
    const parsed = changeTenantPlanSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Datos inválidos" };
    }

    const tenant = await tenantService.changePlan(parsed.data, session.userId);
    revalidatePath("/platform");
    revalidatePath("/platform/tenants");
    revalidatePath(`/platform/tenants/${parsed.data.tenantId}`);

    return { ok: true, data: { planId: tenant.planId } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo cambiar el plan",
    };
  }
}
