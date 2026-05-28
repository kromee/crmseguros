"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProspectCard } from "./prospect-card";
import { ProspectDetailDrawer } from "./prospect-detail-drawer";
import type { ProspectDTO } from "../utils/serialize";

interface ActivityItem {
  id: string;
  type: string;
  summary: string;
  result: string;
  createdAt: string;
  performer: { id: string; name: string } | null;
}

interface NextEventInfo {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  reminderMinutes: number;
  description: string | null;
  status: string;
}

interface Props {
  groups: Record<string, ProspectDTO[]>;
  overview: Record<string, { count: number; totalValue: number }>;
  totalActive: number;
  selectedProspect: ProspectDTO | null;
  recentActivities?: ActivityItem[];
  nextEvent?: NextEventInfo | null;
}

const COLUMNS = [
  { id: "CONTACTO_INICIAL", label: "Contacto Inicial", accent: "border-t-slate-400" },
  { id: "SEGUIMIENTO", label: "Seguimiento", accent: "border-t-blue-500" },
  { id: "COTIZACION", label: "Cotización", accent: "border-t-amber-500" },
  { id: "CIERRE", label: "Cierre", accent: "border-t-emerald-500" },
] as const;

function formatCurrencyShort(value: number) {
  if (value === 0) return "$0";
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function KanbanBoard({
  groups,
  overview,
  totalActive,
  selectedProspect,
  recentActivities = [],
  nextEvent = null,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(params.get("search") ?? "");

  function updateSearchParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    startTransition(() => router.push(`/pipeline?${next.toString()}`));
  }

  function selectProspect(id: string | null) {
    updateSearchParam("selected", id);
  }

  useEffect(() => {
    const current = params.get("search") ?? "";
    if (searchValue === current) return;
    const t = setTimeout(() => updateSearchParam("search", searchValue || null), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, código o servicio..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm"
          />
        </div>
        <span className="text-sm text-slate-500">
          <strong className="text-slate-700">{totalActive}</strong> prospectos activos
        </span>
        <Link href="/pipeline/new" className="ml-auto">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Nuevo prospecto
          </Button>
        </Link>
      </div>

      {/* Tablero */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = groups[col.id] ?? [];
          const colOverview = overview[col.id] ?? { count: 0, totalValue: 0 };
          return (
            <div
              key={col.id}
              className={`flex flex-col bg-slate-50 rounded-xl border-t-4 ${col.accent} min-h-[400px]`}
            >
              <div className="px-4 pt-3 pb-2 border-b border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm text-slate-800">{col.label}</h3>
                  <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {colOverview.count}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {formatCurrencyShort(colOverview.totalValue)} estimados
                </p>
              </div>

              <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-8">
                    Sin prospectos en esta etapa
                  </div>
                ) : (
                  items.map((p) => (
                    <ProspectCard
                      key={p.id}
                      prospect={p}
                      selected={selectedProspect?.id === p.id}
                      onSelect={() => selectProspect(p.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer */}
      <ProspectDetailDrawer
        prospect={selectedProspect}
        recentActivities={recentActivities}
        nextEvent={nextEvent}
        onClose={() => selectProspect(null)}
      />
    </>
  );
}
