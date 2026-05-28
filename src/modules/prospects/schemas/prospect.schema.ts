import { z } from "zod";

export const prospectStageEnum = z.enum([
  "CONTACTO_INICIAL",
  "SEGUIMIENTO",
  "COTIZACION",
  "CIERRE",
]);

export const prospectStatusEnum = z.enum(["ACTIVE", "WON", "LOST"]);
export const priorityEnum = z.enum(["BAJA", "MEDIA", "ALTA", "ATENCION"]);
export const nextActionTypeEnum = z.enum(["LLAMADA", "CITA", "EMAIL", "OTRO"]);

const optionalDate = z
  .union([z.string().length(0), z.string().date(), z.string().datetime(), z.date()])
  .optional()
  .nullable()
  .transform((v) => (v && v !== "" ? new Date(v) : null));

const optionalDecimal = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  });

export const prospectBaseSchema = z.object({
  contactId: z.string().uuid("Contacto inválido"),
  stage: prospectStageEnum.default("CONTACTO_INICIAL"),
  priority: priorityEnum.default("MEDIA"),
  serviceOfInterest: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  estimatedValue: optionalDecimal,
  probability: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().int().min(0).max(100))
    .default(50),
  assignedTo: z.string().uuid().optional().nullable(),
  notes: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
  nextActionType: nextActionTypeEnum.optional().nullable(),
  nextActionDate: optionalDate,
  rating: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1).max(5))
    .default(3),
  status: prospectStatusEnum.default("ACTIVE"),
});

export const createProspectSchema = prospectBaseSchema;
export const updateProspectSchema = prospectBaseSchema.partial();

const contactOriginEnumLocal = z.enum([
  "WHATSAPP",
  "FACEBOOK",
  "INSTAGRAM",
  "TIKTOK",
  "RECOMENDADO",
  "FAMILIA",
  "AMIGO",
  "STAND",
  "GOOGLE_MAPS",
  "PUBLICIDAD",
  "SITIO_WEB",
  "OTRO",
]);

export const createProspectWithContactSchema = z.object({
  fullName: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(200, "Máximo 200 caracteres"),
  phone: z
    .string()
    .min(7, "Teléfono inválido")
    .max(20, "Máximo 20 caracteres"),
  email: z
    .string()
    .email("Correo inválido")
    .max(255)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  photo: z.string().max(500).optional().or(z.literal("").transform(() => undefined)),
  origin: contactOriginEnumLocal,
  serviceOfInterest: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  estimatedValue: optionalDecimal,
  priority: priorityEnum.default("MEDIA"),
  rating: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1).max(5))
    .default(3),
  notes: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
  assignedTo: z.string().uuid().optional().nullable(),
  nextActionType: nextActionTypeEnum.optional().nullable(),
  nextActionDate: optionalDate,
  reminderMinutes: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return 15;
      const n = Number(v);
      return Number.isFinite(n) ? n : 15;
    }),
});

export type CreateProspectWithContactInput = z.infer<
  typeof createProspectWithContactSchema
>;

export const changeStageSchema = z.object({
  stage: prospectStageEnum,
});

export const prospectsFiltersSchema = z.object({
  stage: prospectStageEnum.optional(),
  status: prospectStatusEnum.optional(),
  priority: priorityEnum.optional(),
  assignedTo: z.string().uuid().optional(),
  search: z.string().optional(),
});

export type CreateProspectInput = z.infer<typeof createProspectSchema>;
export type UpdateProspectInput = z.infer<typeof updateProspectSchema>;
export type ProspectsFilters = z.infer<typeof prospectsFiltersSchema>;
