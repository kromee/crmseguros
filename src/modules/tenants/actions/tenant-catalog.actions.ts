"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/core/errors/app-error";
import { requireTenantAdminSession, requireTenantSession } from "@/core/tenant";
import type { ActionResult } from "@/core/types/action-result";
import { updateTenantCatalogSchema } from "../schemas/tenant-catalog.schema";
import { tenantCatalogService } from "../services/tenant-catalog.service";

export async function updateTenantCatalogAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const session = await requireTenantAdminSession();
    const parsed = updateTenantCatalogSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    await tenantCatalogService.update(session.tenantId, parsed.data, session.userId);
    revalidatePath("/settings");
    revalidatePath("/contacts", "layout");
    revalidatePath("/services");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudieron guardar los catálogos",
    };
  }
}

export async function getTenantCatalogAction() {
  const session = await requireTenantSession();
  return tenantCatalogService.get(session.tenantId);
}
