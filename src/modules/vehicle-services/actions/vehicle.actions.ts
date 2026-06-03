"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/core/errors/app-error";
import { requireTenantSession } from "@/core/tenant";
import type { ActionResult } from "@/core/types/action-result";
import {
  createVehicleSchema,
  updateVehicleSchema,
  type CreateVehicleInput,
  type UpdateVehicleInput,
} from "../schemas/vehicle.schema";
import { vehicleService } from "../services/vehicle.service";

export async function createVehicleAction(
  input: CreateVehicleInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTenantSession();
    const parsed = createVehicleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const created = await vehicleService.create(
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
      error: err instanceof AppError ? err.message : "Error al crear trámite",
    };
  }
}

export async function updateVehicleAction(
  id: string,
  input: UpdateVehicleInput
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    const parsed = updateVehicleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const updated = await vehicleService.update(
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
      error: err instanceof AppError ? err.message : "Error al actualizar trámite",
    };
  }
}

export async function deleteVehicleAction(
  id: string,
  contactId: string
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    await vehicleService.remove(session.tenantId, id, session.userId);
    revalidatePath(`/contacts/${contactId}`);
    revalidatePath("/services");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al eliminar trámite",
    };
  }
}
