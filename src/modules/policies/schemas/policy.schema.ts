import { z } from "zod";

export const policyTypeEnum = z.enum(["VIDA", "AUTO", "OTRO"]);
export const policyStatusEnum = z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "RENEWAL"]);
export const paymentFrequencyEnum = z.enum(["MENSUAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"]);
export const coverageTypeEnum = z.enum(["AMPLIA", "LIMITADA", "BASICA", "RC"]);
export const currencyEnum = z.enum(["MXN", "USD", "UDI"]);

const dateSchema = z.union([z.string().date(), z.date()]).transform((v) => new Date(v));
const optionalDate = z
  .union([z.string().length(0), z.string().date(), z.date()])
  .optional()
  .transform((v) => (v && v !== "" ? new Date(v) : null));

const decimalSchema = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .pipe(z.number().nonnegative({ message: "Debe ser un número positivo" }));

const optionalDecimal = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === "" || v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  });

export const policyBaseSchema = z
  .object({
    contactId: z.string().uuid("Contacto inválido"),
    policyNumber: z.string().min(3, "Número de póliza requerido").max(100),
    type: policyTypeEnum,
    plan: z.string().max(200).optional().or(z.literal("").transform(() => undefined)),
    insurer: z.string().max(200).optional().or(z.literal("").transform(() => undefined)),
    startDate: dateSchema,
    endDate: dateSchema,
    paymentFrequency: paymentFrequencyEnum.default("ANUAL"),
    premium: decimalSchema,
    sumInsured: optionalDecimal,
    beneficiaries: z.string().max(1000).optional().or(z.literal("").transform(() => undefined)),
    status: policyStatusEnum.default("ACTIVE"),
    notes: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
    // AUTO
    insuredAsset: z.string().max(2000).optional().or(z.literal("").transform(() => undefined)),
    coverageType: coverageTypeEnum.optional().nullable(),
    vehiclePhoto: z.string().max(500).optional().or(z.literal("").transform(() => undefined)),
    // VIDA
    currency: currencyEnum.optional().nullable(),
    term: z.string().max(100).optional().or(z.literal("").transform(() => undefined)),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La fecha de término debe ser posterior a la de inicio",
    path: ["endDate"],
  });

export const createPolicySchema = policyBaseSchema;
export const updatePolicySchema = z
  .object({
    contactId: z.string().uuid().optional(),
    policyNumber: z.string().min(3).max(100).optional(),
    type: policyTypeEnum.optional(),
    plan: z.string().max(200).optional(),
    insurer: z.string().max(200).optional(),
    startDate: optionalDate,
    endDate: optionalDate,
    paymentFrequency: paymentFrequencyEnum.optional(),
    premium: optionalDecimal,
    sumInsured: optionalDecimal,
    beneficiaries: z.string().max(1000).optional(),
    status: policyStatusEnum.optional(),
    notes: z.string().max(2000).optional(),
    insuredAsset: z.string().max(2000).optional(),
    coverageType: coverageTypeEnum.optional().nullable(),
    vehiclePhoto: z.string().max(500).optional().nullable(),
    currency: currencyEnum.optional().nullable(),
    term: z.string().max(100).optional(),
  });

export const policiesFiltersSchema = z.object({
  contactId: z.string().uuid().optional(),
  type: z.preprocess((v) => (v === "" ? undefined : v), policyTypeEnum.optional()),
  status: z.preprocess((v) => (v === "" ? undefined : v), policyStatusEnum.optional()),
  search: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  expiringInDays: z.coerce.number().int().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
});

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
export type PoliciesFilters = z.infer<typeof policiesFiltersSchema>;
