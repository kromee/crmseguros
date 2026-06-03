import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  MessageCircle,
  Phone,
  RefreshCw,
  Shield,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { requireTenantSession } from "@/core/tenant";
import { formatDateTime, timeAgo } from "@/core/utils/format";
import { prisma } from "@/infrastructure/prisma/client";
import {
  dashboardService,
  formatProjectedRevenue,
} from "@/modules/dashboard/services/dashboard.service";
import { NewEventButton } from "@/modules/calendar/components/new-event-button";
import { AlertsPanel } from "@/modules/dashboard/components/alerts-panel";

export const dynamic = "force-dynamic";

const KPI_ICONS: Record<
  string,
  { Icon: typeof Users; iconColor: string; iconBg: string }
> = {
  portfolio: {
    Icon: Shield,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  collections: {
    Icon: DollarSign,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  prospects: {
    Icon: TrendingUp,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50",
  },
  pending: {
    Icon: Clock,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
  },
};

const ACTIVITY_BADGE: Record<string, string> = {
  LLAMADA: "bg-orange-100 text-orange-700",
  EMAIL: "bg-blue-100 text-blue-700",
  WHATSAPP: "bg-emerald-100 text-emerald-700",
  NOTA: "bg-[var(--color-bg-elevated)] text-theme-secondary",
  VISITA: "bg-purple-100 text-purple-700",
  DOCUMENTO: "bg-indigo-100 text-indigo-700",
};

const ACTIVITY_LABEL: Record<string, string> = {
  LLAMADA: "Llamada",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  NOTA: "Nota",
  VISITA: "Visita",
  DOCUMENTO: "Documento",
};

const RESULT_BADGE: Record<string, { label: string; cls: string }> = {
  EXITOSO: { label: "Exitoso", cls: "bg-emerald-50 text-emerald-700" },
  PENDIENTE: { label: "Pendiente", cls: "bg-amber-50 text-amber-700" },
  SIN_RESPUESTA: { label: "Sin respuesta", cls: "bg-[var(--color-bg-elevated)] text-theme-muted" },
  FALLIDO: { label: "Fallido", cls: "bg-red-50 text-red-600" },
};

const EVENT_ICON: Record<string, { Icon: typeof Phone; color: string }> = {
  LLAMADA: { Icon: Phone, color: "text-blue-600" },
  RENOVACION: { Icon: RefreshCw, color: "text-purple-600" },
  COBRO_PAGO: { Icon: DollarSign, color: "text-red-600" },
  SEGUIMIENTO: { Icon: MessageCircle, color: "text-emerald-600" },
  TAREA: { Icon: CheckCircle2, color: "text-amber-600" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { tenantId, userId } = await requireTenantSession();

  const [dashboardData, contacts, users] = await Promise.all([
    dashboardService.getAll(tenantId, userId),
    prisma.contact.findMany({
      where: { tenantId },
      orderBy: { fullName: "asc" },
      select: { id: true, code: true, fullName: true },
      take: 500,
    }),
    prisma.user.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const { kpis, alerts, agenda, activity, pipeline, portfolio } = dashboardData;
  const today = new Date();

  const dangerAlerts = alerts.filter((a) => a.severity === "danger");
  const warningAlerts = alerts.filter((a) => a.severity === "warning");
  const infoAlerts = alerts.filter((a) => a.severity === "info");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">
            Hola, {session.user.name?.split(" ")[0] ?? "Asesor"}
          </h1>
          <p className="text-sm text-theme-muted mt-0.5">
            Resumen operativo —{" "}
            {today.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/contacts/new"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Nuevo contacto
          </Link>
          <Link
            href="/pipeline/new"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-theme text-theme-secondary hover:border-blue-300 transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5" />
            Nuevo prospecto
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const cfg = KPI_ICONS[kpi.key] ?? KPI_ICONS.portfolio;
          const { Icon, iconColor, iconBg } = cfg;
          return (
            <div key={kpi.key} className="crm-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    kpi.changeType === "positive"
                      ? "text-emerald-700 bg-emerald-50"
                      : kpi.changeType === "danger"
                        ? "text-red-700 bg-red-50"
                        : kpi.changeType === "warning"
                          ? "text-amber-700 bg-amber-50"
                          : "text-theme-muted bg-[var(--color-bg-elevated)]"
                  }`}
                >
                  {kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-theme-primary">{kpi.value}</p>
              <p className="text-xs text-theme-muted mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Resumen de cartera */}
      <div className="crm-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-theme-primary">Resumen de cartera</h2>
          </div>
          <Link href="/finances" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Ver finanzas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MetricBox label="Primas totales" value={formatProjectedRevenue(portfolio.totalPremiums)} accent="text-blue-700" />
          <MetricBox label="Cobrado" value={formatProjectedRevenue(portfolio.totalCollected)} accent="text-emerald-700" />
          <MetricBox label="Pendiente" value={formatProjectedRevenue(portfolio.totalPending)} accent="text-red-700" />
          <MetricBox label="Tasa de cobranza" value={`${portfolio.collectionRate}%`} accent="text-blue-700" />
          <MetricBox label="Tasa de renovación" value={`${portfolio.renewalRate}%`} accent="text-emerald-700" />
          <MetricBox
            label="Renovadas / Vencidas (mes)"
            value={`${portfolio.policiesRenewedThisMonth} / ${portfolio.policiesExpiredThisMonth}`}
            accent="text-theme-secondary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Centro de alertas */}
          <AlertsPanel
            dangerAlerts={dangerAlerts}
            warningAlerts={warningAlerts}
            infoAlerts={infoAlerts}
          />

          {/* Pipeline */}
          <div className="crm-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <h2 className="font-semibold text-theme-primary">Pipeline de ventas</h2>
                <span className="text-xs font-medium text-theme-muted">
                  {pipeline.totalProspects} prospectos · {pipeline.conversionRate}% conversión
                </span>
              </div>
              <Link href="/pipeline" className="text-xs text-blue-600 hover:underline">
                Ver pipeline
              </Link>
            </div>
            <div className="flex gap-1">
              {pipeline.stages.map((stage, i) => {
                const isActive = stage.stage === pipeline.activeStage;
                const isLast = i === pipeline.stages.length - 1;
                return (
                  <div
                    key={stage.stage}
                    className={`flex-1 relative py-3 px-3 text-center text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : stage.count > 0
                          ? "bg-blue-50 text-blue-700"
                          : "bg-[var(--color-bg-input)] text-theme-muted"
                    } ${i === 0 ? "rounded-l-lg" : ""} ${isLast ? "rounded-r-lg" : ""}`}
                  >
                    <p className="font-bold text-base leading-none">{stage.count}</p>
                    <p className="text-[10px] mt-1 opacity-80">{stage.label}</p>
                    {stage.estimatedValue > 0 && (
                      <p className="text-[9px] mt-0.5 opacity-60">
                        {formatProjectedRevenue(stage.estimatedValue)}
                      </p>
                    )}
                    {!isLast && (
                      <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 text-theme-muted/50 z-10" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="crm-card">
            <div className="flex items-center justify-between p-5 border-b border-theme-subtle">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-theme-muted" />
                <h2 className="font-semibold text-theme-primary">Actividad reciente</h2>
                <span className="text-xs text-theme-muted">Interacciones con contactos y prospectos</span>
              </div>
              <Link href="/contacts" className="text-xs text-blue-600 hover:underline">
                Ver contactos
              </Link>
            </div>
            {activity.length === 0 ? (
              <p className="text-sm text-theme-muted text-center py-8 px-5">
                Aún no hay actividad registrada en el sistema.
              </p>
            ) : (
              <div className="divide-y divide-slate-50">
                {activity.map((row) => {
                  const rb = RESULT_BADGE[row.result];
                  return (
                    <div key={row.id} className="flex items-start gap-3 px-5 py-3 hover:bg-[var(--color-bg-hover)]/50 transition-colors">
                      <div className="mt-0.5">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-bold ${
                            ACTIVITY_BADGE[row.type] ?? "bg-[var(--color-bg-elevated)] text-theme-secondary"
                          }`}
                        >
                          {(ACTIVITY_LABEL[row.type] ?? row.type).slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/contacts/${row.contactId}`}
                            className="text-sm font-semibold text-theme-primary hover:text-blue-600 truncate"
                          >
                            {row.contactName}
                          </Link>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              ACTIVITY_BADGE[row.type] ?? "bg-[var(--color-bg-elevated)] text-theme-secondary"
                            }`}
                          >
                            {ACTIVITY_LABEL[row.type] ?? row.type}
                          </span>
                          {rb && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${rb.cls}`}>
                              {rb.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-theme-muted mt-0.5 truncate">{row.summary}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-theme-muted" title={formatDateTime(row.createdAt)}>
                          {timeAgo(row.createdAt)}
                        </p>
                        <p className="text-[10px] text-theme-muted/50 mt-0.5">{row.performerName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha — Agenda + Acciones */}
        <div className="space-y-6">
          {/* Agenda del día */}
          <div className="crm-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-theme-primary">Mi agenda hoy</h2>
                {agenda.length > 0 && (
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {agenda.filter((a) => a.status !== "COMPLETED").length} pendientes
                  </span>
                )}
              </div>
              <Link href="/calendar" className="text-xs text-blue-600 hover:underline">
                Ver mes
              </Link>
            </div>

            {agenda.length === 0 ? (
              <div className="text-sm text-theme-muted text-center py-6 border border-dashed border-theme rounded-lg mb-3">
                No tienes eventos programados hoy.
              </div>
            ) : (
              <div className="space-y-1">
                {agenda.map((item, i) => {
                  const cfg = EVENT_ICON[item.type] ?? { Icon: FileText, color: "text-theme-muted" };
                  const { Icon, color } = cfg;
                  const isLast = i === agenda.length - 1;
                  const isCompleted = item.status === "COMPLETED";
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <div className={`p-1.5 rounded-lg ${isCompleted ? "bg-emerald-50" : "bg-[var(--color-bg-input)]"}`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Icon className={`w-3.5 h-3.5 ${color}`} />
                          )}
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-[var(--color-bg-elevated)] my-1 min-h-[12px]" />}
                      </div>
                      <div className={`pb-3 flex-1 ${isCompleted ? "opacity-50" : ""}`}>
                        <p className="text-xs text-theme-muted">{formatTime(item.startTime)}</p>
                        <p className={`text-sm font-medium text-theme-primary mt-0.5 ${isCompleted ? "line-through" : ""}`}>
                          {item.title}
                        </p>
                        {item.contactName && (
                          <Link
                            href={`/contacts/${item.contactId}`}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {item.contactName}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <NewEventButton
              contacts={contacts}
              users={users}
              currentUserId={session.user.id!}
            />
          </div>

          {/* Resumen rápido de servicios */}
          <div className="crm-card p-5">
            <h2 className="font-semibold text-theme-primary mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-theme-muted" />
              Accesos rápidos
            </h2>
            <div className="space-y-2">
              <QuickLink href="/services" icon={Shield} label="Servicios contratados" />
              <QuickLink href="/finances" icon={CreditCard} label="Panel financiero" />
              <QuickLink href="/pipeline" icon={TrendingUp} label="Pipeline de prospectos" />
              <QuickLink href="/calendar" icon={Calendar} label="Calendario de eventos" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="text-center p-3 rounded-lg bg-[var(--color-bg-input)]">
      <p className={`text-lg font-bold ${accent}`}>{value}</p>
      <p className="text-[10px] text-theme-muted mt-0.5 uppercase tracking-wide font-medium">{label}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Shield;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-theme-subtle hover:border-blue-200 hover:bg-blue-50/30 transition-colors group"
    >
      <Icon className="w-4 h-4 text-theme-muted group-hover:text-blue-600 transition-colors" />
      <span className="text-sm text-theme-secondary group-hover:text-blue-700 flex-1">{label}</span>
      <ArrowRight className="w-3.5 h-3.5 text-theme-muted/50 group-hover:text-blue-500 transition-colors" />
    </Link>
  );
}

export const metadata = {
  title: "Dashboard | CRM Seguros",
};
