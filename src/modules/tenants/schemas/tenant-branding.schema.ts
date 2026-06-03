import { z } from "zod";

export const updateTenantBrandingSchema = z.object({
  name: z.string().min(2, "Nombre requerido").max(200),
  slogan: z.string().max(300).optional(),
  logo: z.string().max(500).optional().nullable(),
});

export type UpdateTenantBrandingInput = z.infer<typeof updateTenantBrandingSchema>;
