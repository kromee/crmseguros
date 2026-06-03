import { prisma } from "@/infrastructure/prisma/client";
import { CONTACT_ORIGINS, POLICY_STATUS_LABELS, PROSPECT_STAGES } from "@/core/constants";
import { formatDate } from "@/core/utils/format";
import type { ReportExportInput } from "@/modules/reports/schemas/report.schema";

export type ReportSummary = {
  contacts: { clients: number; prospects: number; total: number };
  policies: { active: number; expiring30: number; expired: number };
  payments: { yearTotal: number; yearCount: number; pendingCount: number };
  pipeline: { active: number; byStage: Array<{ stage: string; label: string; count: number }> };
};

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: Record<string, unknown>[], columns: { key: string; header: string }[]) {
  const header = columns.map((c) => csvEscape(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => csvEscape(row[c.key])).join(","))
    .join("\n");
  return `\uFEFF${header}\n${body}`;
}

export const reportService = {
  async getSummary(tenantId: string): Promise<ReportSummary> {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const year = now.getFullYear();

    const [
      clients,
      prospects,
      activePolicies,
      expiring30,
      expiredPolicies,
      paymentsAgg,
      pendingPayments,
      pipelineActive,
      pipelineByStage,
    ] = await Promise.all([
      prisma.contact.count({ where: { tenantId, type: "CLIENT" } }),
      prisma.contact.count({ where: { tenantId, type: "PROSPECT" } }),
      prisma.policy.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.policy.count({
        where: {
          tenantId,
          status: "ACTIVE",
          endDate: { gte: now, lte: in30 },
        },
      }),
      prisma.policy.count({ where: { tenantId, status: "EXPIRED" } }),
      prisma.payment.aggregate({
        where: {
          tenantId,
          status: "CONFIRMED",
          paymentDate: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31T23:59:59`),
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.count({ where: { tenantId, status: "PENDING" } }),
      prisma.prospect.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.prospect.groupBy({
        by: ["stage"],
        where: { tenantId, status: "ACTIVE" },
        _count: true,
      }),
    ]);

    const stageMap = Object.fromEntries(
      pipelineByStage.map((r) => [r.stage, r._count])
    );

    return {
      contacts: { clients, prospects, total: clients + prospects },
      policies: { active: activePolicies, expiring30, expired: expiredPolicies },
      payments: {
        yearTotal: Number(paymentsAgg._sum.amount ?? 0),
        yearCount: paymentsAgg._count,
        pendingCount: pendingPayments,
      },
      pipeline: {
        active: pipelineActive,
        byStage: PROSPECT_STAGES.map((s) => ({
          stage: s.value,
          label: s.label,
          count: stageMap[s.value] ?? 0,
        })),
      },
    };
  },

  async exportCsv(tenantId: string, input: ReportExportInput): Promise<{ filename: string; content: string }> {
    const year = input.year ?? new Date().getFullYear();
    const days = input.days ?? 30;
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    switch (input.type) {
      case "contacts-by-origin": {
        const rows = await prisma.contact.groupBy({
          by: ["origin", "type"],
          where: { tenantId },
          _count: true,
        });
        const data = rows.map((r) => ({
          origen:
            CONTACT_ORIGINS.find((o) => o.value === r.origin)?.label ?? r.origin,
          tipo: r.type === "CLIENT" ? "Cliente" : "Prospecto",
          cantidad: r._count,
        }));
        return {
          filename: `contactos-por-origen-${year}.csv`,
          content: rowsToCsv(data, [
            { key: "origen", header: "Origen" },
            { key: "tipo", header: "Tipo" },
            { key: "cantidad", header: "Cantidad" },
          ]),
        };
      }

      case "expiring-policies": {
        const policies = await prisma.policy.findMany({
          where: {
            tenantId,
            status: "ACTIVE",
            endDate: { gte: new Date(), lte: until },
          },
          include: {
            contact: { select: { fullName: true, phone: true, email: true } },
          },
          orderBy: { endDate: "asc" },
        });
        const data = policies.map((p) => ({
          poliza: p.policyNumber,
          tipo: p.type,
          aseguradora: p.insurer ?? "",
          cliente: p.contact.fullName,
          telefono: p.contact.phone,
          vencimiento: formatDate(p.endDate),
          prima: Number(p.premium),
          estado: POLICY_STATUS_LABELS[p.status] ?? p.status,
        }));
        return {
          filename: `polizas-por-vencer-${days}d.csv`,
          content: rowsToCsv(data, [
            { key: "poliza", header: "Póliza" },
            { key: "tipo", header: "Tipo" },
            { key: "aseguradora", header: "Aseguradora" },
            { key: "cliente", header: "Cliente" },
            { key: "telefono", header: "Teléfono" },
            { key: "vencimiento", header: "Vencimiento" },
            { key: "prima", header: "Prima" },
            { key: "estado", header: "Estado" },
          ]),
        };
      }

      case "payments-period": {
        const payments = await prisma.payment.findMany({
          where: {
            tenantId,
            paymentDate: {
              gte: new Date(`${year}-01-01`),
              lte: new Date(`${year}-12-31T23:59:59`),
            },
          },
          include: {
            policy: {
              select: {
                policyNumber: true,
                contact: { select: { fullName: true } },
              },
            },
          },
          orderBy: { paymentDate: "desc" },
        });
        const data = payments.map((p) => ({
          fecha: formatDate(p.paymentDate),
          monto: Number(p.amount),
          metodo: p.method,
          estado: p.status,
          poliza: p.policy?.policyNumber ?? "",
          cliente: p.policy?.contact.fullName ?? "",
          referencia: p.reference ?? "",
        }));
        return {
          filename: `cobranza-${year}.csv`,
          content: rowsToCsv(data, [
            { key: "fecha", header: "Fecha" },
            { key: "monto", header: "Monto" },
            { key: "metodo", header: "Método" },
            { key: "estado", header: "Estado" },
            { key: "poliza", header: "Póliza" },
            { key: "cliente", header: "Cliente" },
            { key: "referencia", header: "Referencia" },
          ]),
        };
      }

      case "pipeline-summary": {
        const prospects = await prisma.prospect.findMany({
          where: { tenantId, status: "ACTIVE" },
          include: {
            contact: { select: { fullName: true, phone: true } },
            assignedUser: { select: { name: true } },
          },
          orderBy: { updatedAt: "desc" },
        });
        const data = prospects.map((p) => ({
          prospecto: p.contact.fullName,
          telefono: p.contact.phone,
          etapa: PROSPECT_STAGES.find((s) => s.value === p.stage)?.label ?? p.stage,
          servicio: p.serviceOfInterest ?? "",
          valor: Number(p.estimatedValue ?? 0),
          probabilidad: p.probability ?? 0,
          asignado: p.assignedUser?.name ?? "",
        }));
        return {
          filename: `pipeline-activo.csv`,
          content: rowsToCsv(data, [
            { key: "prospecto", header: "Prospecto" },
            { key: "telefono", header: "Teléfono" },
            { key: "etapa", header: "Etapa" },
            { key: "servicio", header: "Servicio" },
            { key: "valor", header: "Valor estimado" },
            { key: "probabilidad", header: "Probabilidad %" },
            { key: "asignado", header: "Asignado" },
          ]),
        };
      }

      default:
        throw new Error("Tipo de reporte no soportado");
    }
  },
};
