import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es obligatorio")
    .email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const loginActionSchema = loginSchema.extend({
  /** Solo TENANT_ADMIN: cierra la sesión previa tras validar contraseña */
  takeoverSession: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginActionInput = z.infer<typeof loginActionSchema>;
