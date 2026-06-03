"use client";

import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  CreditCard,
  DollarSign,
  FileText,
  Shield,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { POLICY_TYPES } from "@/core/constants";
import { formatCurrency, formatDate } from "@/core/utils/format";

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

type MonthlyPayment = { month: number; total: number; count: number };
type PremiumByType = { type: string; totalPremium: number; count: number };
type UpcomingPolicy = {
  id: string;
  policyNumber: string;
  type: string;
  insurer: string | null;
  endDate: string;
  premium: number;
  paymentFrequency: string;
  contactId: string;
  contactName: string;
};
type RecentPayment = {
  id: string;
  amount: number;
  paymentDate: string;
  method: string;
  policyNumber: string;
  policyType: string;
  contactId: string;
  contactName: string;
};

interface FinanceData {
  year: number;
  totalPremiums: number;
  totalPayments: number;
  activePoliciesCount: number;
  monthlyPayments: MonthlyPayment[];
  premiumsByType: PremiumByType[];
  upcomingPolicies: UpcomingPolicy[];
  recentPayments: RecentPayment[];
}

interface Props {
  data: FinanceData;
}

function typeLabel(type: string) {
  return POLICY_TYPES.find((t) => t.value === type)?.label ?? type;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  const gradients: Record<string, string> = {
    green: "from-green-500 to-emerald-600",
    blue: "from-blue-500 to-indigo-600",
    purple: "from-purple-500 to-violet-600",
    amber: "from-amber-500 to-orange-500",
  };

  return (
    <div className="crm-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[color]} shadow-sm`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-theme-primary">{value}</p>
      <p className="text-xs text-theme-muted mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-theme-muted mt-1">{sub}</p>}
    </div>
  );
}

export function FinanceDashboard({ data }: Props) {
  const [referenceDate] = useState(() => Date.now());
  const pendingPremium = data.totalPremiums - data.totalPayments;
  const collectionRate =
    data.totalPremiums > 0
      ? Math.round((data.totalPayments / data.totalPremiums) * 100)
      : 0;

  const maxMonthlyTotal = Math.max(...data.monthlyPayments.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-theme-primary">Finanzas</h1>
        <p className="text-sm text-theme-muted mt-0.5">
          Resumen financiero {data.year}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Primas anuales totales"
          value={formatCurrency(data.totalPremiums)}
          sub={`${data.activePoliciesCount} pólizas activas`}
          color="blue"
        />
        <StatCard
          icon={Banknote}
          label="Total cobrado"
          value={formatCurrency(data.totalPayments)}
          sub={`Tasa de cobranza: ${collectionRate}%`}
          color="green"
        />
        <StatCard
          icon={CreditCard}
          label="Pendiente por cobrar"
          value={formatCurrency(Math.max(0, pendingPremium))}
          sub="Estimado anual"
          color="amber"
        />
        <StatCard
          icon={Shield}
          label="Pólizas activas"
          value={String(data.activePoliciesCount)}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfica de barras: pagos mensuales */}
        <div className="lg:col-span-2 crm-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-theme-primary">Cobranza mensual {data.year}</h2>
          </div>

          <div className="flex items-end gap-1.5 h-48">
            {MONTH_NAMES.map((name, i) => {
              const monthData = data.monthlyPayments.find((m) => m.month === i + 1);
              const total = monthData?.total ?? 0;
              const height = maxMonthlyTotal > 0 ? (total / maxMonthlyTotal) * 100 : 0;
              const isCurrentMonth = i === new Date().getMonth();

              return (
                <div
                  key={name}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-[9px] text-theme-muted font-medium">
                    {total > 0 ? formatCurrency(total) : ""}
                  </span>
                  <div className="w-full relative" style={{ height: "140px" }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-md transition-all ${
                        isCurrentMonth
                          ? "bg-gradient-to-t from-blue-500 to-blue-400"
                          : total > 0
                            ? "bg-gradient-to-t from-blue-300 to-blue-200"
                            : "bg-[var(--color-bg-elevated)]"
                      }`}
                      style={{ height: `${Math.max(height, 3)}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${isCurrentMonth ? "text-blue-600" : "text-theme-muted"}`}
                  >
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Primas por tipo */}
        <div className="crm-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-purple-600" />
            <h2 className="font-semibold text-theme-primary">Primas por tipo</h2>
          </div>

          {data.premiumsByType.length === 0 ? (
            <p className="text-xs text-theme-muted text-center py-8">
              Sin datos disponibles
            </p>
          ) : (
            <div className="space-y-3">
              {data.premiumsByType.map((item) => {
                const pct =
                  data.totalPremiums > 0
                    ? Math.round((item.totalPremium / data.totalPremiums) * 100)
                    : 0;

                const colors: Record<string, string> = {
                  AUTO: "from-blue-400 to-blue-500",
                  VIDA: "from-emerald-400 to-emerald-500",
                  OTRO: "from-amber-400 to-amber-500",
                };

                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-theme-secondary">
                        {typeLabel(item.type)}
                      </span>
                      <span className="text-xs text-theme-muted">
                        {formatCurrency(item.totalPremium)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${colors[item.type] ?? "from-slate-300 to-slate-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-theme-muted mt-0.5">
                      {item.count} póliza{item.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Próximos vencimientos */}
        <div className="crm-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-theme-primary">
              Próximos vencimientos (60 días)
            </h2>
          </div>

          {data.upcomingPolicies.length === 0 ? (
            <p className="text-xs text-theme-muted text-center py-6">
              Sin vencimientos próximos
            </p>
          ) : (
            <div className="space-y-2">
              {data.upcomingPolicies.map((p) => {
                const daysLeft = Math.ceil(
                  (new Date(p.endDate).getTime() - referenceDate) / (1000 * 60 * 60 * 24)
                );
                const urgent = daysLeft <= 15;

                return (
                  <Link
                    key={p.id}
                    href={`/contacts/${p.contactId}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors group"
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${
                        urgent ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-theme-primary truncate">
                          {p.contactName}
                        </span>
                        <span className="text-[10px] font-mono text-theme-muted">
                          {p.policyNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-theme-muted">
                        <span>{typeLabel(p.type)}</span>
                        <span className="text-theme-muted/50">·</span>
                        <span>{formatCurrency(p.premium)}</span>
                        <span className="text-theme-muted/50">·</span>
                        <span
                          className={
                            urgent
                              ? "text-red-500 font-semibold"
                              : "text-amber-600"
                          }
                        >
                          {daysLeft} días
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-theme-muted/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagos recientes */}
        <div className="crm-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Banknote className="w-4 h-4 text-green-600" />
            <h2 className="font-semibold text-theme-primary">Pagos recientes</h2>
          </div>

          {data.recentPayments.length === 0 ? (
            <p className="text-xs text-theme-muted text-center py-6">
              Sin pagos registrados
            </p>
          ) : (
            <div className="space-y-2">
              {data.recentPayments.map((pm) => (
                <Link
                  key={pm.id}
                  href={`/contacts/${pm.contactId}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors group"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 flex-shrink-0">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-green-700">
                        {formatCurrency(pm.amount)}
                      </span>
                      <span className="text-[10px] font-mono text-theme-muted">
                        {pm.policyNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-theme-muted">
                      <span>{pm.contactName}</span>
                      <span className="text-theme-muted/50">·</span>
                      <span>{formatDate(pm.paymentDate, "dd MMM yyyy")}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-theme-muted/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
