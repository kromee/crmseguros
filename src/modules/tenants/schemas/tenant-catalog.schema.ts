import { z } from "zod";

export const contactOriginCatalogItemSchema = z.object({
  value: z.string().min(1).max(50),
  label: z.string().min(1).max(150),
  enabled: z.boolean(),
});

export const updateTenantCatalogSchema = z.object({
  insurers: z
    .array(z.string().trim().min(1).max(100))
    .min(1, "Debe haber al menos una aseguradora"),
  contactOrigins: z.array(contactOriginCatalogItemSchema).min(1),
});

export type UpdateTenantCatalogInput = z.infer<typeof updateTenantCatalogSchema>;
