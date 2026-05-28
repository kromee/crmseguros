"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Info,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { DashboardAlert } from "../services/dashboard.service";

type FilterTab = "all" | "policy" | "prospect" | "payment" | "contact";

const FILTER_TABS: { id: FilterTab; label: string; icon: typeof Shield }[] = [
  { id: "all", label: "Todas", icon: AlertTriangle },
  { id: "policy", label: "Pólizas", icon: Shield },
  { id: "prospect", label: "Prospectos", icon: Users },
  { id: "payment", label: "Pagos", icon: CreditCard },
  { id: "contact", label: "Clientes", icon: Info },
];

const SEVERITY_STYLES = {
  danger: {
    dot: "bg-red-500",
    bg: "bg-red-50 border-red-100 hover:border-red-200",
    title: "text-red-800",
    detail: "text-red-600",
  },
  warning: {
    dot: "bg-amber-500",
    bg: "bg-amber-50 border-amber-100 hover:border-amber-200",
    title: "text-amber-800",
    detail: "text-amber-600",
  },
  info: {
    dot: "bg-blue-500",
    bg: "bg-blue-50 border-blue-100 hover:border-blue-200",
    title: "text-blue-800",
    detail: "text-blue-600",
  },
};

const INITIAL_VISIBLE = 5;

interface Props {
  dangerAlerts: DashboardAlert[];
  warningAlerts: DashboardAlert[];
  infoAlerts: DashboardAlert[];
}

export function AlertsPanel({ dangerAlerts, warningAlerts, infoAlerts }: Props) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [expanded, setExpanded] = useState(false);

  const allAlerts = [...dangerAlerts, ...warningAlerts, ...infoAlerts];
  const filtered = filter === "all" ? allAlerts : allAlerts.filter((a) => a.category === filter);
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hasMore = filtered.length > INITIAL_VISIBLE;

  const total = allAlerts.length;
  const countByCategory = (cat: FilterTab) =>
    cat === "all" ? total : allAlerts.filter((a) => a.category === cat).length;

  return (
    <div className="crm-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h2 className="font-semibold text-slate-800">Centro de alertas</h2>
          <div className="flex items-center gap-1.5 ml-1">
            {dangerAlerts.length > 0 && (
              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                {dangerAlerts.length} críticas
              </span>
            )}
            {warningAlerts.length > 0 && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {warningAlerts.length} advertencias
              </span>
            )}
            {infoAlerts.length > 0 && (
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                {infoAlerts.length} info
              </span>
            )}
          </div>
        </div>
        <Link href="/services" className="text-xs text-blue-600 hover:underline">
          Ver servicios
        </Link>
      </div>

      {/* Filtros por categoría */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const count = countByCategory(tab.id);
          const active = filter === tab.id;
          if (count === 0 && tab.id !== "all") return null;
          return (
            <button
              key={tab.id}
              onClick={() => { setFilter(tab.id); setExpanded(false); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                active
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
              <span className={`ml-0.5 ${active ? "text-white/70" : "text-slate-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista de alertas */}
      <div className="space-y-2">
        {visible.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-lg">
            Sin alertas en esta categoría.
          </div>
        ) : (
          visible.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity];
            const inner = (
              <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition-colors ${style.bg}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${style.title}`}>{alert.title}</p>
                  <p className={`text-xs mt-0.5 ${style.detail}`}>{alert.detail}</p>
                </div>
                {alert.href && (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 rotate-[-90deg] flex-shrink-0 mt-1" />
                )}
              </div>
            );

            return alert.href ? (
              <Link key={alert.id} href={alert.href} className="block">
                {inner}
              </Link>
            ) : (
              <div key={alert.id}>{inner}</div>
            );
          })
        )}
      </div>

      {/* Expandir / colapsar */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-1 w-full mt-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Ver todas ({filtered.length - INITIAL_VISIBLE} más)
            </>
          )}
        </button>
      )}
    </div>
  );
}
