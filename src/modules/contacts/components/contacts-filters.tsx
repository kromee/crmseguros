"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { TrendingUp } from "lucide-react";
import { CONTACT_ORIGINS } from "@/core/constants";

const TYPES = [
  { value: "CLIENT", label: "Clientes" },
  { value: "PROSPECT", label: "Prospectos" },
] as const;

interface Props {
  counts: Record<string, number>;
  growthLabel?: string;
}

export function ContactsFilters({ counts, growthLabel = "+12.4%" }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentType = params.get("type") ?? "CLIENT";
  const currentOrigin = params.get("origin") ?? "";

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete("page");
    startTransition(() => router.push(`/contacts?${next.toString()}`));
  }

  return (
    <aside className={`w-52 flex-shrink-0 space-y-4 ${isPending ? "opacity-70" : ""}`}>
      {/* Categoría */}
      <div className="crm-card p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Categoría
        </p>
        <div className="space-y-1">
          {TYPES.map((t) => {
            const active = currentType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => updateParam("type", t.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-blue-600 text-white font-medium"
                    : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? "bg-white" : "bg-slate-400"
                    }`}
                  />
                  {t.label}
                </span>
                <span className={`text-xs ${active ? "text-blue-100" : "text-slate-400"}`}>
                  {counts[t.value] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Origen */}
      <div className="crm-card p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Origen
        </p>
        <select
          value={currentOrigin}
          onChange={(e) => updateParam("origin", e.target.value || null)}
          className="crm-select"
        >
          <option value="">Todos los orígenes</option>
          {CONTACT_ORIGINS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Crecimiento */}
      <div className="rounded-xl bg-blue-600 p-4 text-white">
        <p className="text-xs font-semibold text-blue-200 mb-1">Crecimiento Mensual</p>
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold">{growthLabel}</span>
          <TrendingUp className="w-5 h-5 text-blue-200" />
        </div>
      </div>
    </aside>
  );
}
