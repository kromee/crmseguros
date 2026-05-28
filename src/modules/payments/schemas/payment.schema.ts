import { z } from "zod";

export const paymentMethodEnum = z.enum([
  "EFECTIVO",
  "TRANSFERENCIA",
  "TARJETA",
  "CHEQUE",
  "DOMICILIACION",
  "OTRO",
]);
export const paymentStatusEnum = z.enum(["PENDING", "CONFIRMED", "CANCELLED"]);

const dateSchema = z
  .union([z.string().date(), z.date()])
  .transform((v) => new Date(v));

const optionalDate = z
  .union([z.string().length(0), z.string().date(), z.date()])
  .optional()
  .nullable()
  .transform((v) => (v && v !== "" ? new Date(v) : null));

const decimalSchema = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .pipe(z.number().positive({ message: "El monto debe ser mayor a 0" }));

export const paymentBaseSchema = z.object({
  policyId: z.string().uuid("Póliza inválida"),
  amount: decimalSchema,
  paymentDate: dateSchema,
  periodStart: optionalDate,
  periodEnd: optionalDate,
  method: paymentMethodEnum.default("TRANSFERENCIA"),
  reference: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  status: paymentStatusEnum.default("CONFIRMED"),
});

export const createPaymentSchema = paymentBaseSchema;

export const paymentFiltersSchema = z.object({
  policyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  status: paymentStatusEnum.optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type PaymentFilters = z.infer<typeof paymentFiltersSchema>;
