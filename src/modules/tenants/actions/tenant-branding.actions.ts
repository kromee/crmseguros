"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/core/errors/app-error";
import { requireTenantAdminSession } from "@/core/tenant/session";
import type { ActionResult } from "@/core/types/action-result";
import {
  updateTenantBrandingSchema,
  type UpdateTenantBrandingInput,
} from "../schemas/tenant-branding.schema";
import { tenantBrandingService } from "../services/tenant-branding.service";

export async function updateTenantBrandingAction(
  input: UpdateTenantBrandingInput
): Promise<ActionResult<{ name: string }>> {
  try {
    const session = await requireTenantAdminSession();
    const parsed = updateTenantBrandingSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const updated = await tenantBrandingService.update(
      session.tenantId,
      parsed.data,
      session.userId
    );

    revalidatePath("/", "layout");
    revalidatePath("/settings");

    return { ok: true, data: { name: updated.name } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo guardar la marca",
    };
  }
}

export async function removeTenantLogoAction(): Promise<ActionResult> {
  try {
    const session = await requireTenantAdminSession();
    await tenantBrandingService.removeLogo(session.tenantId, session.userId);
    revalidatePath("/", "layout");
    revalidatePath("/settings");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo quitar el logo",
    };
  }
}
