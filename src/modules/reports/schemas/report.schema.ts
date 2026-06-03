import { z } from "zod";

export const reportExportSchema = z.object({
  type: z.enum([
    "contacts-by-origin",
    "expiring-policies",
    "payments-period",
    "pipeline-summary",
  ]),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  days: z.coerce.number().int().min(7).max(365).optional(),
});

export type ReportExportInput = z.infer<typeof reportExportSchema>;
