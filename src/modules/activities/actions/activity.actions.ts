"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/core/errors/app-error";
import { requireTenantSession } from "@/core/tenant";
import { isTenantAdmin } from "@/core/tenant/roles";
import type { ActionResult } from "@/core/types/action-result";
import {
  createActivitySchema,
  updateActivitySchema,
  type CreateActivityInput,
  type UpdateActivityInput,
} from "../schemas/activity.schema";
import { activityService } from "../services/activity.service";

export async function createActivityAction(
  input: CreateActivityInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTenantSession();
    const parsed = createActivitySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const created = await activityService.create(
      session.tenantId,
      parsed.data,
      session.userId
    );
    revalidatePath(`/contacts/${created.contactId}`);
    revalidatePath(`/contacts/${created.contactId}/interactions`);
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al registrar actividad",
    };
  }
}

export async function updateActivityAction(
  id: string,
  input: UpdateActivityInput
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    const parsed = updateActivitySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const updated = await activityService.update(
      session.tenantId,
      id,
      parsed.data,
      session.userId,
      isTenantAdmin(session.role)
    );
    revalidatePath(`/contacts/${updated.contactId}`);
    revalidatePath(`/contacts/${updated.contactId}/interactions`);
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al actualizar actividad",
    };
  }
}

export async function deleteActivityAction(
  id: string,
  contactId: string
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    await activityService.remove(
      session.tenantId,
      id,
      session.userId,
      isTenantAdmin(session.role)
    );
    revalidatePath(`/contacts/${contactId}`);
    revalidatePath(`/contacts/${contactId}/interactions`);
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al eliminar actividad",
    };
  }
}
