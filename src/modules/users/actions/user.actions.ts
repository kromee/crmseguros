"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/core/errors/app-error";
import { requireAppSession, requireTenantAdminSession, requireTenantSession } from "@/core/tenant";
import type { ActionResult } from "@/core/types/action-result";
import {
  createUserSchema,
  updateUserAvatarSchema,
  updateUserStatusSchema,
  updateProfileSchema,
  changePasswordSchema,
  adminResetPasswordSchema,
  type CreateUserInput,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type AdminResetPasswordInput,
} from "../schemas/user.schema";
import { userService } from "../services/user.service";

export async function createUserAction(
  input: CreateUserInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTenantAdminSession();
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const created = await userService.create(
      session.tenantId,
      parsed.data,
      session.userId
    );
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
    const session = await requireTenantAdminSession();
    if (session.userId === userId && !isActive) {
      return { ok: false, error: "No puedes desactivar tu propio usuario" };
    }
    const parsed = updateUserStatusSchema.safeParse({ isActive });
    if (!parsed.success) return { ok: false, error: "Estado inválido" };
    await userService.setActive(
      session.tenantId,
      userId,
      parsed.data.isActive,
      session.userId
    );
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
    const session = await requireTenantAdminSession();
    const parsed = updateUserAvatarSchema.safeParse({ avatar });
    if (!parsed.success) return { ok: false, error: "Avatar inválido" };
    await userService.setAvatar(
      session.tenantId,
      userId,
      parsed.data.avatar ?? null,
      session.userId
    );
    revalidatePath("/settings");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo actualizar el avatar",
    };
  }
}

export async function getMyProfileAction(): Promise<
  ActionResult<{
    id: string;
    name: string;
    email: string;
    title: string | null;
    avatar: string | null;
  }>
> {
  try {
    const session = await requireTenantSession();
    const profile = await userService.getProfile(session.tenantId, session.userId);
    return {
      ok: true,
      data: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        title: profile.title,
        avatar: profile.avatar,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo cargar el perfil",
    };
  }
}

export async function updateMyProfileAction(
  input: UpdateProfileInput
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    await userService.updateProfile(session.tenantId, session.userId, parsed.data);
    revalidatePath("/settings");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo actualizar el perfil",
    };
  }
}

export async function changeMyPasswordAction(
  input: ChangePasswordInput
): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.flatten().fieldErrors.confirmPassword?.[0] ?? "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    await userService.changePassword(
      session.tenantId,
      session.userId,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo cambiar la contraseña",
    };
  }
}

export async function adminResetUserPasswordAction(
  input: AdminResetPasswordInput
): Promise<ActionResult> {
  try {
    const session = await requireAppSession();
    const parsed = adminResetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.flatten().fieldErrors.confirmPassword?.[0] ?? "Datos inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    await userService.setPasswordByAdmin(
      {
        userId: session.userId,
        role: session.role,
        tenantId: session.tenantId,
      },
      parsed.data.userId,
      parsed.data.newPassword
    );

    revalidatePath("/settings");
    revalidatePath("/platform/tenants", "layout");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo restablecer la contraseña",
    };
  }
}

export async function updateMyAvatarAction(avatar: string | null): Promise<ActionResult> {
  try {
    const session = await requireTenantSession();
    const parsed = updateUserAvatarSchema.safeParse({ avatar });
    if (!parsed.success) return { ok: false, error: "Avatar inválido" };
    await userService.setAvatar(
      session.tenantId,
      session.userId,
      parsed.data.avatar ?? null,
      session.userId
    );
    revalidatePath("/settings");
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo actualizar el avatar",
    };
  }
}
