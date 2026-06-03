"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/core/errors/app-error";
import { requireTenantSession } from "@/core/tenant";
import type { ActionResult } from "@/core/types/action-result";
import { eventService } from "@/modules/calendar/services/event.service";

export async function completeReminderAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    await eventService.update(
      session.tenantId,
      id,
      { status: "COMPLETED" },
      session.userId
    );
    revalidatePath("/reminders");
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al marcar recordatorio",
    };
  }
}
