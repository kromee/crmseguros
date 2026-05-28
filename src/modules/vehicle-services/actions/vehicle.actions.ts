"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { AppError } from "@/core/errors/app-error";
import type { ActionResult } from "@/core/types/action-result";
import {
  createVehicleSchema,
  updateVehicleSchema,
  type CreateVehicleInput,
  type UpdateVehicleInput,
} from "../schemas/vehicle.schema";
import { vehicleService } from "../services/vehicle.service";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new AppError("No autorizado", 401);
  return session.user;
}

export async function createVehicleAction(
  input: CreateVehicleInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = createVehicleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const created = await vehicleService.create(parsed.data, user.id);
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
    const user = await requireUser();
    const parsed = updateVehicleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const updated = await vehicleService.update(id, parsed.data, user.id);
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
    const user = await requireUser();
    await vehicleService.remove(id, user.id);
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
