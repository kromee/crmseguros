import { z } from "zod";

export const licenseTermEnum = z.enum(["MONTHLY", "ANNUAL", "MONTHS_24", "YEARS_4"]);

export const generateLicenseSchema = z.object({
  planSlug: z.string().min(1),
  term: licenseTermEnum,
  keyValidDays: z.number().int().min(1).max(365).optional(),
  notes: z.string().max(500).optional(),
});

export const activateTenantSchema = z.object({
  licenseKey: z
    .string()
    .min(8, "Ingresa la clave de licencia")
    .transform((v) => v.trim().toUpperCase()),
  companyName: z.string().min(2, "Nombre de la agencia requerido").max(200),
  adminName: z.string().min(2, "Nombre del administrador requerido").max(150),
  email: z.string().email("Correo inválido").transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Incluye al menos una mayúscula")
    .regex(/[0-9]/, "Incluye al menos un número"),
});

export type GenerateLicenseInput = z.infer<typeof generateLicenseSchema>;
export type ActivateTenantInput = z.infer<typeof activateTenantSchema>;

export function normalizeLicenseKey(key: string): string {
  return key.trim().toUpperCase().replace(/\s+/g, "");
}
