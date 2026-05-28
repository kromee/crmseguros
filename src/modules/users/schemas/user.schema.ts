import { z } from "zod";

export const userRoleEnum = z.enum(["ADMIN", "USER"]);

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

export type CreateUserInput = z.infer<typeof createUserSchema>;
