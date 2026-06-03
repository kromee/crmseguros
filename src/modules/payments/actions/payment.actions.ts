"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/core/errors/app-error";
import { requireTenantSession } from "@/core/tenant";
import { paymentService } from "../services/payment.service";
import { createPaymentSchema } from "../schemas/payment.schema";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createPaymentAction(
  raw: unknown
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    const parsed = createPaymentSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    await paymentService.create(session.tenantId, parsed.data);
    revalidatePath("/services");
    revalidatePath("/contacts");
    revalidatePath("/finances");
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof AppError ? err.message : "Error al registrar el pago";
    return { ok: false, error: message };
  }
}

export async function deletePaymentAction(
  id: string,
  _policyId: string
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    await paymentService.delete(session.tenantId, id);
    revalidatePath(`/contacts`);
    revalidatePath("/services");
    revalidatePath("/finances");
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof AppError ? err.message : "Error al eliminar el pago";
    return { ok: false, error: message };
  }
}
