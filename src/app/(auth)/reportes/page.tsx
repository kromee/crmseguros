import { requireTenantSession } from "@/core/tenant";
import { reportService } from "@/modules/reports/services/report.service";
import { ReportsDashboard } from "@/modules/reports/components/reports-dashboard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reportes — CRM Seguros" };

export default async function ReportesPage() {
  const { tenantId } = await requireTenantSession();
  const year = new Date().getFullYear();
  const summary = await reportService.getSummary(tenantId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">Reportes</h1>
        <p className="text-sm text-theme-muted mt-0.5">
          Resumen operativo y exportación CSV para análisis externo
        </p>
      </div>
      <ReportsDashboard summary={summary} year={year} />
    </div>
  );
}
