"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { AppError } from "@/core/errors/app-error";
import type { ActionResult } from "@/core/types/action-result";
import {
  createUserSchema,
  updateUserAvatarSchema,
  updateUserStatusSchema,
  type CreateUserInput,
} from "../schemas/user.schema";
import { userService } from "../services/user.service";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new AppError("No autorizado", 401);
  if (session.user.role !== "ADMIN") throw new AppError("Solo un administrador puede realizar esta acción", 403);
  return session.user;
}

export async function createUserAction(
  input: CreateUserInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAdmin();
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const created = await userService.create(parsed.data, user.id);
    revalidatePath("/settings");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo crear el usuario",
    };
  }
}

export async function setUserActiveAction(
  userId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    if (user.id === userId && !isActive) {
      return { ok: false, error: "No puedes desactivar tu propio usuario" };
    }
    const parsed = updateUserStatusSchema.safeParse({ isActive });
    if (!parsed.success) return { ok: false, error: "Estado inválido" };
    await userService.setActive(userId, parsed.data.isActive, user.id);
    revalidatePath("/settings");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo actualizar el estado",
    };
  }
}

export async function setUserAvatarAction(
  userId: string,
  avatar: string | null
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const parsed = updateUserAvatarSchema.safeParse({ avatar });
    if (!parsed.success) return { ok: false, error: "Avatar inválido" };
    await userService.setAvatar(userId, parsed.data.avatar ?? null, user.id);
    revalidatePath("/settings");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo actualizar el avatar",
    };
  }
}
