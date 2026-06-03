"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/core/errors/app-error";
import { requireTenantSession } from "@/core/tenant";
import type { ActionResult } from "@/core/types/action-result";
import {
  createPensionSchema,
  updatePensionSchema,
  type CreatePensionInput,
  type UpdatePensionInput,
} from "../schemas/pension.schema";
import { pensionService } from "../services/pension.service";

export async function createPensionAction(
  input: CreatePensionInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTenantSession();
    const parsed = createPensionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const created = await pensionService.create(
      session.tenantId,
      parsed.data,
      session.userId
    );
    revalidatePath(`/contacts/${created.contactId}`);
    revalidatePath("/services");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al crear servicio",
    };
  }
}

export async function updatePensionAction(
  id: string,
  input: UpdatePensionInput
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    const parsed = updatePensionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const updated = await pensionService.update(
      session.tenantId,
      id,
      parsed.data,
      session.userId
    );
    revalidatePath(`/contacts/${updated.contactId}`);
    revalidatePath("/services");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al actualizar servicio",
    };
  }
}

export async function deletePensionAction(
  id: string,
  contactId: string
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    await pensionService.remove(session.tenantId, id, session.userId);
    revalidatePath(`/contacts/${contactId}`);
    revalidatePath("/services");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al eliminar servicio",
    };
  }
}
