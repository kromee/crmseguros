import { z } from "zod";
import { licenseTermEnum } from "@/modules/licenses/schemas/license.schema";

export const tenantStatusFilterEnum = z.enum(["ALL", "ACTIVE", "SUSPENDED", "PENDING"]);

export const listTenantsSchema = z.object({
  status: tenantStatusFilterEnum.optional().default("ALL"),
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(50).optional().default(15),
});

export const updateTenantStatusSchema = z.object({
  tenantId: z.string().uuid(),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const renewSubscriptionSchema = z.object({
  tenantId: z.string().uuid(),
  term: licenseTermEnum,
});

export const changeTenantPlanSchema = z.object({
  tenantId: z.string().uuid(),
  planId: z.string().uuid(),
});

export type ListTenantsInput = z.infer<typeof listTenantsSchema>;
export type UpdateTenantStatusInput = z.infer<typeof updateTenantStatusSchema>;
export type RenewSubscriptionInput = z.infer<typeof renewSubscriptionSchema>;
export type ChangeTenantPlanInput = z.infer<typeof changeTenantPlanSchema>;
