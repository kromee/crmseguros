"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/core/errors/app-error";
import { requireTenantSession } from "@/core/tenant";
import type { ActionResult } from "@/core/types/action-result";
import {
  createEventSchema,
  updateEventSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from "../schemas/event.schema";
import { eventService } from "../services/event.service";

export async function createEventAction(
  input: CreateEventInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTenantSession();
    const parsed = createEventSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const created = await eventService.create(
      session.tenantId,
      parsed.data,
      session.userId
    );
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    if (created.contactId) {
      revalidatePath(`/contacts/${created.contactId}`);
    }
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al crear evento",
    };
  }
}

export async function updateEventAction(
  id: string,
  input: UpdateEventInput
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    const parsed = updateEventSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const updated = await eventService.update(
      session.tenantId,
      id,
      parsed.data,
      session.userId
    );
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    if (updated.contactId) revalidatePath(`/contacts/${updated.contactId}`);
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al actualizar evento",
    };
  }
}

export async function completeEventAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    await eventService.update(
      session.tenantId,
      id,
      { status: "COMPLETED" },
      session.userId
    );
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidatePath("/reminders");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al marcar como completado",
    };
  }
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    await eventService.remove(session.tenantId, id, session.userId);
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al eliminar evento",
    };
  }
}
