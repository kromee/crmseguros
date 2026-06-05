import { z } from "zod";

export const userRoleEnum = z.enum(["TENANT_ADMIN", "USER"]);

export const createUserSchema = z.object({
  name: z.string().min(3, "Nombre requerido").max(150, "Max 150 caracteres"),
  email: z.string().email("Correo inválido").max(255).transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
  role: userRoleEnum.default("USER"),
  title: z.string().max(100).optional().or(z.literal("").transform(() => undefined)),
  isActive: z.boolean().default(true),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateUserAvatarSchema = z.object({
  avatar: z.string().max(500).optional().nullable(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(3, "Nombre requerido").max(150),
  title: z.string().max(100).optional().or(z.literal("").transform(() => undefined)),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Contraseña actual requerida"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres").max(100),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const adminResetPasswordSchema = z
  .object({
    userId: z.string().uuid(),
    newPassword: z.string().min(8, "Mínimo 8 caracteres").max(100),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const forceLogoutUserSchema = z.object({
  userId: z.string().uuid(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
export type ForceLogoutUserInput = z.infer<typeof forceLogoutUserSchema>;
