import { z } from "zod";

export const pensionRequestTypeEnum = z.enum(["ASESORIA", "TRAMITE", "OTRO"]);
export const pensionLawEnum = z.enum(["IMSS_LEY73", "AFORE_LEY97", "OTRO"]);
export const serviceStatusEnum = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);

const dateSchema = z.union([z.string().date(), z.date()]).transform((v) => new Date(v));
const optionalDate = z
  .union([z.string().length(0), z.string().date(), z.date()])
  .optional()
  .transform((v) => (v && v !== "" ? new Date(v) : null));

const decimalSchema = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .pipe(z.number().nonnegative());

const optionalDecimal = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === "" || v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  });

export const pensionBaseSchema = z.object({
  contactId: z.string().uuid("Contacto inválido"),
  requestDate: dateSchema,
  requestType: pensionRequestTypeEnum.default("ASESORIA"),
  pensionLaw: pensionLawEnum.optional().nullable(),
  cost: decimalSchema,
  advance: optionalDecimal,
  advanceDate: optionalDate,
  settlement: optionalDecimal,
  settlementDate: optionalDate,
  description: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
  bitacora: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
  status: serviceStatusEnum.default("PENDING"),
});

export const createPensionSchema = pensionBaseSchema;
export const updatePensionSchema = z.object({
  requestDate: optionalDate,
  requestType: pensionRequestTypeEnum.optional(),
  pensionLaw: pensionLawEnum.optional().nullable(),
  cost: optionalDecimal,
  advance: optionalDecimal,
  advanceDate: optionalDate,
  settlement: optionalDecimal,
  settlementDate: optionalDate,
  description: z.string().max(2000).optional(),
  bitacora: z.string().max(2000).optional(),
  status: serviceStatusEnum.optional(),
});

export const pensionsFiltersSchema = z.object({
  contactId: z.string().uuid().optional(),
  status: z.preprocess((v) => (v === "" ? undefined : v), serviceStatusEnum.optional()),
  requestType: z.preprocess((v) => (v === "" ? undefined : v), pensionRequestTypeEnum.optional()),
  search: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
});

export type CreatePensionInput = z.infer<typeof createPensionSchema>;
export type UpdatePensionInput = z.infer<typeof updatePensionSchema>;
export type PensionsFilters = z.infer<typeof pensionsFiltersSchema>;
