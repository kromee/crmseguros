import { z } from "zod";

export const contactTypeEnum = z.enum(["CLIENT", "PROSPECT"]);
export const contactStatusEnum = z.enum(["ACTIVE", "INACTIVE", "PENDING"]);
export const contactOriginEnum = z.enum([
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

const optionalDate = z
  .union([z.string().length(0), z.string().date(), z.date()])
  .optional()
  .nullable()
  .transform((v) => (v && v !== "" ? new Date(v) : null));

export const contactBaseSchema = z.object({
  type: contactTypeEnum.default("PROSPECT"),
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
  birthDate: optionalDate,
  activity: z.string().max(200).optional().or(z.literal("").transform(() => undefined)),
  city: z.string().max(100).optional().or(z.literal("").transform(() => undefined)),
  state: z.string().max(100).optional().or(z.literal("").transform(() => undefined)),
  origin: contactOriginEnum,
  status: contactStatusEnum.default("PENDING"),
  notes: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
});

export const createContactSchema = contactBaseSchema;
export const updateContactSchema = contactBaseSchema.partial();

export const contactsFiltersSchema = z.object({
  type: contactTypeEnum.optional(),
  status: contactStatusEnum.optional(),
  origin: contactOriginEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactsFilters = z.infer<typeof contactsFiltersSchema>;
