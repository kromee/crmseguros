"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { AppError } from "@/core/errors/app-error";
import { paymentService } from "../services/payment.service";
import { createPaymentSchema } from "../schemas/payment.schema";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createPaymentAction(
  raw: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autorizado" };

  const parsed = createPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await paymentService.create(parsed.data);
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
  policyId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autorizado" };

  try {
    await paymentService.delete(id);
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
