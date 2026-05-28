"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { AppError } from "@/core/errors/app-error";
import type { ActionResult } from "@/core/types/action-result";
import { eventService } from "@/modules/calendar/services/event.service";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new AppError("No autorizado", 401);
  return session.user;
}

export async function completeReminderAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await eventService.update(id, { status: "COMPLETED" }, user.id);
    revalidatePath("/reminders");
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al marcar recordatorio",
    };
  }
}
