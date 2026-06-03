"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todas" },
  { value: "ACTIVE", label: "Activas" },
  { value: "SUSPENDED", label: "Suspendidas" },
  { value: "PENDING", label: "Pendientes" },
] as const;

export function TenantsToolbar() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = params.get("status") ?? "ALL";
  const currentQ = params.get("q") ?? "";

  function pushParams(next: URLSearchParams) {
    next.delete("page");
    startTransition(() => {
      const qs = next.toString();
      router.push(qs ? `/platform/tenants?${qs}` : "/platform/tenants");
    });
  }

  function setStatus(status: string) {
    const next = new URLSearchParams(params.toString());
    if (status === "ALL") next.delete("status");
    else next.set("status", status);
    pushParams(next);
  }

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement).value.trim();
    const next = new URLSearchParams(params.toString());
    if (q) next.set("q", q);
    else next.delete("q");
    pushParams(next);
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${isPending ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const active = currentStatus === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-[var(--color-bg-card)] text-theme-secondary border-theme hover:border-blue-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={onSearchSubmit} className="flex-1 flex gap-2 max-w-md ml-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
          <Input
            name="q"
            defaultValue={currentQ}
            placeholder="Buscar agencia..."
            className="pl-9"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-lg border border-theme bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)]"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
