"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdminSession } from "@/core/tenant/session";
import { AppError } from "@/core/errors/app-error";
import type { ActionResult } from "@/core/types/action-result";
import {
  activateTenantSchema,
  generateLicenseSchema,
  type ActivateTenantInput,
  type GenerateLicenseInput,
} from "../schemas/license.schema";
import { licenseService } from "../services/license.service";

export async function generateLicenseAction(
  input: GenerateLicenseInput
): Promise<
  ActionResult<{
    code: string;
    term: string;
    planName: string;
    maxUsers: number;
  }>
> {
  try {
    await requireSuperAdminSession();
    const parsed = generateLicenseSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { code, planName, maxUsers, license } = await licenseService.generate(parsed.data);
    revalidatePath("/platform/licenses");

    return {
      ok: true,
      data: {
        code,
        planName,
        maxUsers,
        term: licenseService.termLabel(license.term),
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo generar la licencia",
    };
  }
}

export async function activateTenantAction(
  input: ActivateTenantInput
): Promise<
  ActionResult<{
    email: string;
    tenantName: string;
  }>
> {
  try {
    const parsed = activateTenantSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Revisa los datos del formulario",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const result = await licenseService.activate(parsed.data);

    return {
      ok: true,
      data: {
        email: result.adminEmail,
        tenantName: result.tenantName,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo activar la licencia",
    };
  }
}
