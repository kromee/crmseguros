"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppError } from "@/core/errors/app-error";
import type { ActionResult } from "@/core/types/action-result";
import {
  changeStageSchema,
  createProspectSchema,
  createProspectWithContactSchema,
  updateProspectSchema,
  type CreateProspectInput,
  type CreateProspectWithContactInput,
  type UpdateProspectInput,
} from "../schemas/prospect.schema";
import { prospectService } from "../services/prospect.service";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new AppError("No autorizado", 401);
  return session.user;
}

export async function createProspectAction(
  input: CreateProspectInput
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    const user = await requireUser();
    const parsed = createProspectSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const created = await prospectService.create(parsed.data, user.id);
    revalidatePath("/pipeline");
    revalidatePath(`/contacts/${created.contactId}`);
    return { ok: true, data: { id: created.id, code: created.code } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al crear prospecto",
    };
  }
}

export async function createProspectAndRedirect(input: CreateProspectInput) {
  const result = await createProspectAction(input);
  if (result.ok) {
    redirect(`/pipeline?selected=${result.data.id}`);
  }
  return result;
}

export async function createProspectWithContactAction(
  input: CreateProspectWithContactInput
): Promise<ActionResult<{ prospectId: string; contactId: string; code: string }>> {
  try {
    const user = await requireUser();
    const parsed = createProspectWithContactSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const { contact, prospect } = await prospectService.createWithContact(
      parsed.data,
      user.id
    );
    revalidatePath("/pipeline");
    revalidatePath("/contacts");
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    return {
      ok: true,
      data: {
        prospectId: prospect.id,
        contactId: contact.id,
        code: prospect.code,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al crear prospecto",
    };
  }
}

export async function updateProspectAction(
  id: string,
  input: UpdateProspectInput
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = updateProspectSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    await prospectService.update(id, parsed.data, user.id);
    revalidatePath("/pipeline");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al actualizar prospecto",
    };
  }
}

export async function changeProspectStageAction(
  id: string,
  stage: string
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = changeStageSchema.safeParse({ stage });
    if (!parsed.success) {
      return { ok: false, error: "Etapa inválida" };
    }
    await prospectService.changeStage(id, parsed.data.stage, user.id);
    revalidatePath("/pipeline");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al mover prospecto",
    };
  }
}

export async function convertProspectToClientAction(
  id: string
): Promise<ActionResult<{ contactId: string }>> {
  try {
    const user = await requireUser();
    const result = await prospectService.convertToClient(id, user.id);
    revalidatePath("/pipeline");
    revalidatePath(`/contacts/${result.contactId}`);
    revalidatePath("/contacts");
    return { ok: true, data: result };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al convertir a cliente",
    };
  }
}

export async function markProspectLostAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await prospectService.markAsLost(id, user.id);
    revalidatePath("/pipeline");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al marcar como perdido",
    };
  }
}

export async function deleteProspectAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await prospectService.remove(id, user.id);
    revalidatePath("/pipeline");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "Error al eliminar prospecto",
    };
  }
}
