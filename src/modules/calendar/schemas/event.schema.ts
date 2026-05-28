import { z } from "zod";

export const eventTypeEnum = z.enum([
  "RENOVACION",
  "COBRO_PAGO",
  "SEGUIMIENTO",
  "LLAMADA",
  "TAREA",
]);

export const eventStatusEnum = z.enum(["PENDING", "COMPLETED", "CANCELLED"]);
export const priorityEnum = z.enum(["BAJA", "MEDIA", "ALTA", "ATENCION"]);

const dateTimeSchema = z
  .union([z.string().min(1), z.date()])
  .transform((v) => new Date(v))
  .refine((d) => !Number.isNaN(d.getTime()), { message: "Fecha inválida" });

export const eventBaseSchema = z
  .object({
    title: z.string().min(3, "Título obligatorio").max(300),
    type: eventTypeEnum,
    contactId: z.string().uuid().optional().nullable(),
    userId: z.string().uuid("Usuario inválido"),
    startDate: dateTimeSchema,
    endDate: dateTimeSchema,
    description: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
    priority: priorityEnum.default("MEDIA"),
    notifyClient: z.coerce.boolean().default(false),
    notifyAgent: z.coerce.boolean().default(true),
    reminderMinutes: z.coerce.number().int().min(0).max(43200).default(15),
    status: eventStatusEnum.default("PENDING"),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "La fecha de fin debe ser posterior al inicio",
    path: ["endDate"],
  });

export const createEventSchema = eventBaseSchema;

export const updateEventSchema = z.object({
  title: z.string().min(3).max(300).optional(),
  type: eventTypeEnum.optional(),
  contactId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional(),
  startDate: dateTimeSchema.optional(),
  endDate: dateTimeSchema.optional(),
  description: z.string().max(2000).optional(),
  priority: priorityEnum.optional(),
  notifyClient: z.coerce.boolean().optional(),
  notifyAgent: z.coerce.boolean().optional(),
  reminderMinutes: z.coerce.number().int().min(0).max(43200).optional(),
  status: eventStatusEnum.optional(),
});

export const eventsFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  type: eventTypeEnum.optional(),
  status: eventStatusEnum.optional(),
  rangeStart: z.string().optional(),
  rangeEnd: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventsFilters = z.infer<typeof eventsFiltersSchema>;
