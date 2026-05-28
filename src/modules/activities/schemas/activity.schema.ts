import { z } from "zod";

export const activityTypeEnum = z.enum([
  "LLAMADA",
  "EMAIL",
  "WHATSAPP",
  "NOTA",
  "VISITA",
  "DOCUMENTO",
]);

export const activityResultEnum = z.enum([
  "EXITOSO",
  "PENDIENTE",
  "SIN_RESPUESTA",
  "FINALIZADO",
]);

export const activityAttachmentSchema = z.object({
  path: z.string().min(1),
  originalName: z.string().min(1).max(255),
});

export const activityBaseSchema = z.object({
  contactId: z.string().uuid("Contacto inválido"),
  prospectId: z.string().uuid().optional().nullable(),
  policyId: z.string().uuid().optional().nullable(),
  type: activityTypeEnum,
  summary: z
    .string()
    .min(3, "Describe brevemente la interacción")
    .max(2000, "Máximo 2000 caracteres"),
  result: activityResultEnum.default("PENDIENTE"),
  isAutomatic: z.boolean().default(false),
  attachments: z.array(activityAttachmentSchema).max(5).optional().nullable(),
});

export const createActivitySchema = activityBaseSchema;
export const updateActivitySchema = activityBaseSchema.partial();

export const activitiesFiltersSchema = z.object({
  contactId: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
  type: activityTypeEnum.optional(),
  result: activityResultEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ActivitiesFilters = z.infer<typeof activitiesFiltersSchema>;
