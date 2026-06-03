"use server";

import { AppError } from "@/core/errors/app-error";
import { requireTenantSession } from "@/core/tenant";
import type { ActionResult } from "@/core/types/action-result";
import { reportExportSchema } from "../schemas/report.schema";
import { reportService } from "../services/report.service";

export async function exportReportAction(
  input: unknown
): Promise<ActionResult<{ filename: string; content: string }>> {
  try {
    const session = await requireTenantSession();
    const parsed = reportExportSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Parámetros de reporte inválidos" };
    }

    const result = await reportService.exportCsv(session.tenantId, parsed.data);
    return { ok: true, data: result };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudo generar el reporte",
    };
  }
}

export async function getReportsSummaryAction() {
  const session = await requireTenantSession();
  return reportService.getSummary(session.tenantId);
}
