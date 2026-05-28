"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { AppError } from "@/core/errors/app-error";
import type { ActionResult } from "@/core/types/action-result";
import {
  createActivitySchema,
  updateActivitySchema,
  type CreateActivityInput,
  type UpdateActivityInput,
} from "../schemas/activity.schema";
import { activityService } from "../services/activity.service";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new AppError("No autorizado", 401);
  return session.user;
}

export async function createActivityAction(
  input: CreateActivityInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = createActivitySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const created = await activityService.create(parsed.data, user.id);
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
    const user = await requireUser();
    const parsed = updateActivitySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const updated = await activityService.update(
      id,
      parsed.data,
      user.id,
      user.role === "ADMIN"
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
    const user = await requireUser();
    await activityService.remove(id, user.id, user.role === "ADMIN");
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
