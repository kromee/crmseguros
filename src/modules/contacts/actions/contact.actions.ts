"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppError } from "@/core/errors/app-error";
import type { ActionResult } from "@/core/types/action-result";
import {
  createContactSchema,
  updateContactSchema,
  type CreateContactInput,
  type UpdateContactInput,
} from "../schemas/contact.schema";
import { contactService } from "../services/contact.service";

export type { ActionResult };

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("No autorizado", 401);
  }
  return session.user;
}

export async function createContactAction(
  input: CreateContactInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    const user = await requireUser();
    const parsed = createContactSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const contact = await contactService.create(parsed.data, user.id);
    revalidatePath("/contacts");
    return { ok: true, data: { id: contact.id, code: contact.code } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al crear contacto",
    };
  }
}

export async function updateContactAction(
  id: string,
  input: UpdateContactInput
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = updateContactSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    await contactService.update(id, parsed.data, user.id);
    revalidatePath("/contacts");
    revalidatePath(`/contacts/${id}`);
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al actualizar contacto",
    };
  }
}

export async function deleteContactAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await contactService.remove(id, user.id);
    revalidatePath("/contacts");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al eliminar contacto",
    };
  }
}

export async function createContactAndRedirect(input: CreateContactInput) {
  const result = await createContactAction(input);
  if (result.ok) {
    redirect(`/contacts/${result.data.id}`);
  }
  return result;
}
