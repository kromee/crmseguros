"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

const TYPES = [
  { value: "CLIENT", label: "Clientes" },
  { value: "PROSPECT", label: "Prospectos" },
] as const;

interface Props {
  counts: Record<string, number>;
  growth: {
    label: string;
    detail: string;
    trend: "up" | "down" | "flat";
  };
  contactOrigins: ReadonlyArray<{ value: string; label: string }>;
}

export function ContactsFilters({ counts, growth, contactOrigins }: Props) {
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
    <aside
      className={`w-52 flex-shrink-0 space-y-4 transition-opacity duration-200 ${
        isPending ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Categoría */}
      <div className="crm-card p-4">
        <p className="text-xs font-semibold text-theme-muted uppercase tracking-wide mb-3">
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
                    : "hover:bg-[var(--color-bg-hover)] text-theme-secondary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? "bg-[var(--color-bg-card)]" : "bg-[var(--color-text-muted)]"
                    }`}
                  />
                  {t.label}
                </span>
                <span className={`text-xs ${active ? "text-blue-100" : "text-theme-muted"}`}>
                  {counts[t.value] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Origen */}
      <div className="crm-card p-4">
        <p className="text-xs font-semibold text-theme-muted uppercase tracking-wide mb-3">
          Origen
        </p>
        <select
          value={currentOrigin}
          onChange={(e) => updateParam("origin", e.target.value || null)}
          className="crm-select"
        >
          <option value="">Todos los orígenes</option>
          {contactOrigins.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Crecimiento */}
      <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-4 text-white shadow-sm">
        <p className="text-xs font-semibold text-blue-200 mb-1">Crecimiento mensual</p>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-bold">{growth.label}</span>
          {growth.trend === "up" && <TrendingUp className="w-5 h-5 text-blue-200" />}
          {growth.trend === "down" && <TrendingDown className="w-5 h-5 text-blue-200" />}
        </div>
        <p className="text-[11px] text-blue-200/90 mt-1 leading-snug">{growth.detail}</p>
      </div>
    </aside>
  );
}
