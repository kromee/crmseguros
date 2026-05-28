import { prisma } from "@/infrastructure/prisma/client";

type Variant = "positive" | "danger" | "warning" | "neutral";

export interface DashboardKpi {
  key: string;
  label: string;
  value: string;
  change: string;
  changeType: Variant;
}

export interface DashboardAlert {
  id: string;
  severity: "danger" | "warning" | "info";
  title: string;
  detail: string;
  href?: string;
  category: "policy" | "prospect" | "payment" | "contact";
}

export interface AgendaItem {
  id: string;
  startTime: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  contactId: string | null;
  contactName: string | null;
}

export interface RecentActivityRow {
  id: string;
  createdAt: string;
  contactId: string;
  contactName: string;
  type: string;
  summary: string;
  performerName: string;
  result: string;
}

export interface PipelineStageMetric {
  stage: string;
  label: string;
  count: number;
  estimatedValue: number;
}

export interface PortfolioSummary {
  totalActivePolicies: number;
  totalExpiredPolicies: number;
  totalPremiums: number;
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
  renewalRate: number;
  policiesRenewedThisMonth: number;
  policiesExpiredThisMonth: number;
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

const STAGE_LABEL: Record<string, string> = {
  CONTACTO_INICIAL: "Contacto inicial",
  SEGUIMIENTO: "Seguimiento",
  COTIZACION: "Cotización",
  CIERRE: "Cierre",
};

const STAGE_ORDER = ["CONTACTO_INICIAL", "SEGUIMIENTO", "COTIZACION", "CIERRE"];

export const dashboardService = {
  async getKpis(): Promise<DashboardKpi[]> {
    const now = new Date();
    const weekAgo = addDays(now, -7);
    const monthStart = startOfMonth(now);
    const in30 = addDays(now, 30);

    const [
      activeClients,
      newClientsWeek,
      totalPoliciesActive,
      expiredNotRenewed,
      renewals30,
      activeProspects,
      newProspectsWeek,
      convertedThisMonth,
      totalPaymentsMonth,
      pendingEvents,
    ] = await Promise.all([
      prisma.contact.count({ where: { type: "CLIENT", status: "ACTIVE" } }),
      prisma.contact.count({
        where: { type: "CLIENT", status: "ACTIVE", createdAt: { gte: weekAgo } },
      }),
      prisma.policy.count({ where: { status: "ACTIVE", endDate: { gte: startOfDay(now) } } }),
      prisma.policy.count({
        where: {
          status: "ACTIVE",
          endDate: { lt: startOfDay(now) },
          renewedBy: null,
        },
      }),
      prisma.policy.count({
        where: { status: "ACTIVE", endDate: { gte: startOfDay(now), lte: in30 } },
      }),
      prisma.prospect.count({ where: { status: "ACTIVE" } }),
      prisma.prospect.count({
        where: { status: "ACTIVE", createdAt: { gte: weekAgo } },
      }),
      prisma.prospect.count({
        where: { status: "WON", updatedAt: { gte: monthStart } },
      }),
      prisma.payment.aggregate({
        where: { status: "CONFIRMED", paymentDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.calendarEvent.count({
        where: { status: "PENDING", startDate: { lte: endOfDay(now) } },
      }),
    ]);

    const collectedMonth = Number(totalPaymentsMonth._sum.amount ?? 0);

    return [
      {
        key: "portfolio",
        label: "Cartera activa",
        value: totalPoliciesActive.toLocaleString("es-MX"),
        change: expiredNotRenewed > 0
          ? `${expiredNotRenewed} vencidas sin renovar`
          : "Todas al día",
        changeType: expiredNotRenewed > 0 ? "danger" : "positive",
      },
      {
        key: "collections",
        label: "Cobranza del mes",
        value: formatMoney(collectedMonth),
        change: renewals30 > 0
          ? `${renewals30} renovaciones próximas`
          : "Sin renovaciones pendientes",
        changeType: renewals30 > 0 ? "warning" : "neutral",
      },
      {
        key: "prospects",
        label: "Prospectos activos",
        value: activeProspects.toLocaleString("es-MX"),
        change: convertedThisMonth > 0
          ? `${convertedThisMonth} convertido${convertedThisMonth > 1 ? "s" : ""} este mes`
          : newProspectsWeek > 0
            ? `+${newProspectsWeek} esta semana`
            : "Sin nuevos esta semana",
        changeType: convertedThisMonth > 0 ? "positive" : newProspectsWeek > 0 ? "positive" : "neutral",
      },
      {
        key: "pending",
        label: "Pendientes hoy",
        value: pendingEvents.toLocaleString("es-MX"),
        change: `${newClientsWeek} cliente${newClientsWeek !== 1 ? "s" : ""} nuevo${newClientsWeek !== 1 ? "s" : ""} esta semana`,
        changeType: pendingEvents > 5 ? "warning" : pendingEvents > 0 ? "neutral" : "positive",
      },
    ];
  },

  async getAllAlerts(): Promise<DashboardAlert[]> {
    const now = new Date();
    const in3 = addDays(now, 3);
    const in7 = addDays(now, 7);
    const in30 = addDays(now, 30);
    const daysAgo7 = addDays(now, -7);
    const daysAgo15 = addDays(now, -15);

    const [
      overduePolicies,
      criticalPolicies,
      warningPolicies,
      staleProspects,
      overdueProspectActions,
      inactiveClients,
      pendingPayments,
    ] = await Promise.all([
      prisma.policy.findMany({
        where: { status: "ACTIVE", endDate: { lt: startOfDay(now) }, renewedBy: null },
        orderBy: { endDate: "asc" },
        take: 20,
        select: {
          id: true, policyNumber: true, endDate: true, premium: true, type: true, plan: true,
          contact: { select: { id: true, fullName: true } },
        },
      }),
      prisma.policy.findMany({
        where: { status: "ACTIVE", endDate: { gte: startOfDay(now), lte: in3 } },
        orderBy: { endDate: "asc" },
        take: 10,
        select: {
          id: true, policyNumber: true, endDate: true, premium: true,
          contact: { select: { id: true, fullName: true } },
        },
      }),
      prisma.policy.findMany({
        where: { status: "ACTIVE", endDate: { gt: in3, lte: in30 } },
        orderBy: { endDate: "asc" },
        take: 10,
        select: {
          id: true, policyNumber: true, endDate: true,
          contact: { select: { id: true, fullName: true } },
        },
      }),
      prisma.prospect.findMany({
        where: {
          status: "ACTIVE",
          updatedAt: { lt: daysAgo15 },
        },
        orderBy: { updatedAt: "asc" },
        take: 10,
        select: {
          id: true, code: true, stage: true, updatedAt: true,
          contact: { select: { id: true, fullName: true } },
        },
      }),
      prisma.prospect.findMany({
        where: {
          status: "ACTIVE",
          nextActionDate: { lt: startOfDay(now) },
        },
        orderBy: { nextActionDate: "asc" },
        take: 10,
        select: {
          id: true, code: true, nextActionDate: true, nextActionType: true,
          contact: { select: { id: true, fullName: true } },
        },
      }),
      prisma.contact.findMany({
        where: {
          type: "CLIENT",
          status: "ACTIVE",
          activities: { none: { createdAt: { gte: daysAgo7 } } },
          policies: { some: { status: "ACTIVE", endDate: { gte: startOfDay(now), lte: in30 } } },
        },
        take: 10,
        select: { id: true, fullName: true, code: true },
      }),
      prisma.payment.findMany({
        where: { status: "PENDING" },
        orderBy: { paymentDate: "asc" },
        take: 10,
        select: {
          id: true, amount: true, paymentDate: true,
          policy: {
            select: {
              policyNumber: true,
              contact: { select: { id: true, fullName: true } },
            },
          },
        },
      }),
    ]);

    const alerts: DashboardAlert[] = [];

    overduePolicies.forEach((p) => {
      const days = Math.max(1, Math.floor((Date.now() - p.endDate.getTime()) / 864e5));
      alerts.push({
        id: `overdue-${p.id}`,
        severity: "danger",
        category: "policy",
        title: `Póliza vencida: ${p.contact.fullName}`,
        detail: `${p.policyNumber} · ${formatMoney(Number(p.premium))} · ${days} día${days === 1 ? "" : "s"} de retraso`,
        href: `/contacts/${p.contact.id}`,
      });
    });

    criticalPolicies.forEach((p) => {
      const hours = Math.max(1, Math.floor((p.endDate.getTime() - Date.now()) / 36e5));
      alerts.push({
        id: `critical-${p.id}`,
        severity: "danger",
        category: "policy",
        title: `Vence en ${hours < 48 ? `${hours}h` : `${Math.ceil(hours / 24)} días`}: ${p.contact.fullName}`,
        detail: `${p.policyNumber} · ${formatMoney(Number(p.premium))}`,
        href: `/contacts/${p.contact.id}`,
      });
    });

    warningPolicies.forEach((p) => {
      const days = Math.ceil((p.endDate.getTime() - Date.now()) / 864e5);
      alerts.push({
        id: `warning-${p.id}`,
        severity: "warning",
        category: "policy",
        title: `Renovar en ${days} días: ${p.contact.fullName}`,
        detail: `${p.policyNumber}`,
        href: `/contacts/${p.contact.id}`,
      });
    });

    overdueProspectActions.forEach((p) => {
      const days = Math.max(1, Math.floor((Date.now() - (p.nextActionDate?.getTime() ?? Date.now())) / 864e5));
      alerts.push({
        id: `prospect-action-${p.id}`,
        severity: "danger",
        category: "prospect",
        title: `Acción atrasada: ${p.contact.fullName}`,
        detail: `${p.code} · ${p.nextActionType ?? "Seguimiento"} programado hace ${days} día${days === 1 ? "" : "s"}`,
        href: `/contacts/${p.contact.id}`,
      });
    });

    staleProspects.forEach((p) => {
      const days = Math.floor((Date.now() - p.updatedAt.getTime()) / 864e5);
      alerts.push({
        id: `stale-${p.id}`,
        severity: "warning",
        category: "prospect",
        title: `Prospecto sin actividad: ${p.contact.fullName}`,
        detail: `${p.code} · ${STAGE_LABEL[p.stage] ?? p.stage} · ${days} días sin movimiento`,
        href: `/contacts/${p.contact.id}`,
      });
    });

    inactiveClients.forEach((c) => {
      alerts.push({
        id: `inactive-${c.id}`,
        severity: "info",
        category: "contact",
        title: `Contactar cliente: ${c.fullName}`,
        detail: `${c.code} · Tiene póliza próxima a vencer y sin contacto reciente`,
        href: `/contacts/${c.id}`,
      });
    });

    pendingPayments.forEach((pay) => {
      alerts.push({
        id: `payment-${pay.id}`,
        severity: "warning",
        category: "payment",
        title: `Pago pendiente: ${pay.policy.contact.fullName}`,
        detail: `${pay.policy.policyNumber} · ${formatMoney(Number(pay.amount))}`,
        href: `/contacts/${pay.policy.contact.id}`,
      });
    });

    return alerts;
  },

  async getTodayAgenda(userId: string): Promise<AgendaItem[]> {
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId,
        startDate: { gte: startOfDay(), lte: endOfDay() },
      },
      orderBy: { startDate: "asc" },
      take: 15,
      include: {
        contact: { select: { id: true, fullName: true } },
      },
    });

    return events.map((e) => ({
      id: e.id,
      startTime: e.startDate.toISOString(),
      title: e.title,
      description: e.description,
      type: e.type,
      status: e.status,
      contactId: e.contact?.id ?? null,
      contactName: e.contact?.fullName ?? null,
    }));
  },

  async getRecentActivity(limit = 15): Promise<RecentActivityRow[]> {
    const rows = await prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        contact: { select: { id: true, fullName: true } },
        performer: { select: { name: true } },
      },
    });

    return rows.map((a) => ({
      id: a.id,
      createdAt: a.createdAt.toISOString(),
      contactId: a.contactId,
      contactName: a.contact.fullName,
      type: a.type,
      summary: a.summary,
      performerName: a.performer.name,
      result: a.result,
    }));
  },

  async getPipelineProgress(): Promise<{
    stages: PipelineStageMetric[];
    activeStage: string;
    projectedRevenue: number;
    totalProspects: number;
    conversionRate: number;
  }> {
    const [rows, totalConverted, totalCreated] = await Promise.all([
      prisma.prospect.groupBy({
        by: ["stage"],
        where: { status: "ACTIVE" },
        _count: { _all: true },
        _sum: { estimatedValue: true },
      }),
      prisma.prospect.count({ where: { status: "WON" } }),
      prisma.prospect.count(),
    ]);

    const byStage = new Map(rows.map((r) => [r.stage, r]));
    const stages: PipelineStageMetric[] = STAGE_ORDER.map((stage) => {
      const r = byStage.get(stage as never);
      return {
        stage,
        label: STAGE_LABEL[stage] ?? stage,
        count: r?._count?._all ?? 0,
        estimatedValue: Number(r?._sum?.estimatedValue ?? 0),
      };
    });

    const totalProspects = stages.reduce((s, st) => s + st.count, 0);
    const activeStage =
      stages.slice().sort((a, b) => b.count - a.count).find((s) => s.count > 0)?.stage ?? STAGE_ORDER[0];
    const activeMetric = stages.find((s) => s.stage === activeStage)!;
    const conversionRate = totalCreated > 0 ? Math.round((totalConverted / totalCreated) * 100) : 0;

    return {
      stages,
      activeStage,
      projectedRevenue: activeMetric.estimatedValue,
      totalProspects,
      conversionRate,
    };
  },

  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const now = new Date();
    const monthStart = startOfMonth(now);

    const [
      activePolicies,
      expiredPolicies,
      premiumsAggregate,
      paymentsConfirmed,
      renewedThisMonth,
      expiredThisMonth,
    ] = await Promise.all([
      prisma.policy.count({ where: { status: "ACTIVE", endDate: { gte: startOfDay(now) } } }),
      prisma.policy.count({
        where: {
          OR: [
            { status: "EXPIRED" },
            { status: "ACTIVE", endDate: { lt: startOfDay(now) } },
          ],
        },
      }),
      prisma.policy.aggregate({
        where: { status: "ACTIVE", endDate: { gte: startOfDay(now) } },
        _sum: { premium: true },
      }),
      prisma.payment.aggregate({
        where: { status: "CONFIRMED" },
        _sum: { amount: true },
      }),
      prisma.policy.count({
        where: { renewedFromId: { not: null }, createdAt: { gte: monthStart } },
      }),
      prisma.policy.count({
        where: {
          status: "ACTIVE",
          endDate: { gte: monthStart, lt: startOfDay(now) },
          renewedBy: null,
        },
      }),
    ]);

    const totalPremiums = Number(premiumsAggregate._sum.premium ?? 0);
    const totalCollected = Number(paymentsConfirmed._sum.amount ?? 0);
    const totalPending = Math.max(0, totalPremiums - totalCollected);
    const collectionRate = totalPremiums > 0 ? Math.round((totalCollected / totalPremiums) * 100) : 0;
    const renewalDenominator = renewedThisMonth + expiredThisMonth;
    const renewalRate = renewalDenominator > 0 ? Math.round((renewedThisMonth / renewalDenominator) * 100) : 100;

    return {
      totalActivePolicies: activePolicies,
      totalExpiredPolicies: expiredPolicies,
      totalPremiums,
      totalCollected,
      totalPending,
      collectionRate,
      renewalRate,
      policiesRenewedThisMonth: renewedThisMonth,
      policiesExpiredThisMonth: expiredThisMonth,
    };
  },

  async getAll(userId: string) {
    const [kpis, alerts, agenda, activity, pipeline, portfolio] = await Promise.all([
      this.getKpis(),
      this.getAllAlerts(),
      this.getTodayAgenda(userId),
      this.getRecentActivity(15),
      this.getPipelineProgress(),
      this.getPortfolioSummary(),
    ]);
    return { kpis, alerts, agenda, activity, pipeline, portfolio };
  },
};

export function formatProjectedRevenue(value: number) {
  return formatMoney(value);
}
