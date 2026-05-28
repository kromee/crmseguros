import { z } from "zod";

export const vehicleServiceTypeEnum = z.enum([
  "ALTA",
  "BAJA",
  "PLACAS_NUEVAS",
  "RENOVACION_PLACAS",
  "TARJETA_CIRCULACION",
  "OTRO",
]);
export const serviceStatusEnum = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const vehicleRequestModeEnum = z.enum(["COTIZACION", "TRAMITE"]);

const dateSchema = z.union([z.string().date(), z.date()]).transform((v) => new Date(v));
const optionalDate = z
  .union([z.string().length(0), z.string().date(), z.date()])
  .optional()
  .transform((v) => (v && v !== "" ? new Date(v) : null));

const optionalDecimal = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === "" || v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  });

export const documentChecklistSchema = z.object({
  ine: z.boolean().default(false),
  tarjetaCirculacion: z.boolean().default(false),
  factura: z.boolean().default(false),
  titulo: z.boolean().default(false),
}).default({
  ine: false,
  tarjetaCirculacion: false,
  factura: false,
  titulo: false,
});

export const documentFilesSchema = z.object({
  ine: z.string().max(500).optional().nullable(),
  tarjetaCirculacion: z.string().max(500).optional().nullable(),
  factura: z.string().max(500).optional().nullable(),
  titulo: z.string().max(500).optional().nullable(),
}).default({});

export const vehicleBaseSchema = z.object({
  contactId: z.string().uuid("Contacto inválido"),
  startDate: dateSchema,
  serviceType: vehicleServiceTypeEnum,
  requestMode: vehicleRequestModeEnum.default("TRAMITE"),
  description: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
  quote: optionalDecimal,
  status: serviceStatusEnum.default("PENDING"),
  documentChecklist: documentChecklistSchema,
  documentFiles: documentFilesSchema.optional(),
});

export const createVehicleSchema = vehicleBaseSchema;
export const updateVehicleSchema = z.object({
  startDate: optionalDate,
  serviceType: vehicleServiceTypeEnum.optional(),
  requestMode: vehicleRequestModeEnum.optional(),
  description: z.string().max(2000).optional(),
  quote: optionalDecimal,
  status: serviceStatusEnum.optional(),
  documentChecklist: documentChecklistSchema.optional(),
  documentFiles: documentFilesSchema.optional(),
});

export const vehiclesFiltersSchema = z.object({
  contactId: z.string().uuid().optional(),
  status: z.preprocess((v) => (v === "" ? undefined : v), serviceStatusEnum.optional()),
  serviceType: z.preprocess((v) => (v === "" ? undefined : v), vehicleServiceTypeEnum.optional()),
  search: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehiclesFilters = z.infer<typeof vehiclesFiltersSchema>;
export type DocumentChecklist = z.infer<typeof documentChecklistSchema>;
