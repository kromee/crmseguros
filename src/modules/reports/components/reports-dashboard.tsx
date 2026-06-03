"use client";

import { useTransition } from "react";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/core/utils/format";
import { exportReportAction } from "@/modules/reports/actions/report.actions";
import type { ReportSummary } from "@/modules/reports/services/report.service";

const REPORTS = [
  {
    type: "contacts-by-origin" as const,
    title: "Contactos por origen",
    description: "Desglose de clientes y prospectos según canal de captación",
    icon: Users,
  },
  {
    type: "expiring-policies" as const,
    title: "Pólizas por vencer",
    description: "Pólizas activas que vencen en los próximos 30 días",
    icon: Shield,
  },
  {
    type: "payments-period" as const,
    title: "Cobranza del año",
    description: "Pagos registrados en el año en curso",
    icon: FileSpreadsheet,
  },
  {
    type: "pipeline-summary" as const,
    title: "Pipeline activo",
    description: "Prospectos en curso con etapa, valor y asignación",
    icon: TrendingUp,
  },
];

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsDashboard({ summary, year }: { summary: ReportSummary; year: number }) {
  const [isPending, startTransition] = useTransition();

  function exportReport(type: (typeof REPORTS)[number]["type"]) {
    startTransition(async () => {
      const res = await exportReportAction({
        type,
        year,
        days: type === "expiring-policies" ? 30 : undefined,
      });
      if (!res.ok) {
        toast.error("error" in res ? res.error : "No se pudo exportar");
        return;
      }
      if (!res.data) {
        toast.error("No se pudo exportar");
        return;
      }
      downloadCsv(res.data.filename, res.data.content);
      toast.success("Reporte descargado");
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Contactos</p>
          <p className="text-2xl font-bold text-theme-primary">{summary.contacts.total}</p>
          <p className="text-xs text-theme-muted mt-1">
            {summary.contacts.clients} clientes · {summary.contacts.prospects} prospectos
          </p>
        </div>
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Pólizas activas</p>
          <p className="text-2xl font-bold text-theme-primary">{summary.policies.active}</p>
          <p className="text-xs text-amber-600 mt-1">
            {summary.policies.expiring30} vencen en 30 días
          </p>
        </div>
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Cobranza {year}</p>
          <p className="text-2xl font-bold text-theme-primary">
            {formatCurrency(summary.payments.yearTotal)}
          </p>
          <p className="text-xs text-theme-muted mt-1">
            {summary.payments.yearCount} pagos · {summary.payments.pendingCount} pendientes
          </p>
        </div>
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Pipeline</p>
          <p className="text-2xl font-bold text-theme-primary">{summary.pipeline.active}</p>
          <p className="text-xs text-theme-muted mt-1">prospectos activos</p>
        </div>
      </div>

      <div className="crm-card p-6">
        <h2 className="font-semibold text-theme-primary flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Pipeline por etapa
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summary.pipeline.byStage.map((stage) => (
            <div
              key={stage.stage}
              className="rounded-lg border border-theme-subtle p-4 bg-[var(--color-bg-input)]"
            >
              <p className="text-xs text-theme-muted uppercase tracking-wide">{stage.label}</p>
              <p className="text-xl font-bold text-theme-primary mt-1">{stage.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map(({ type, title, description, icon: Icon }) => (
          <div key={type} className="crm-card p-5 flex flex-col">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/15">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-theme-primary">{title}</h3>
                <p className="text-sm text-theme-muted mt-0.5">{description}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-auto gap-2 w-fit"
              disabled={isPending}
              onClick={() => exportReport(type)}
            >
              <Download className="w-4 h-4" />
              Descargar CSV
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
