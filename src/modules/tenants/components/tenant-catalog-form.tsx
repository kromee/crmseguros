"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TenantCatalogSettings } from "@/core/tenant/catalog-settings";
import { updateTenantCatalogAction } from "@/modules/tenants/actions/tenant-catalog.actions";

export function TenantCatalogForm({
  catalog,
  embedded = false,
}: {
  catalog: TenantCatalogSettings;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [insurers, setInsurers] = useState<string[]>(catalog.insurers);
  const [origins, setOrigins] = useState(catalog.contactOrigins);
  const [newInsurer, setNewInsurer] = useState("");

  function resetForm() {
    setInsurers(catalog.insurers);
    setOrigins(catalog.contactOrigins);
    setNewInsurer("");
  }

  function handleOpenChange(next: boolean) {
    if (next) resetForm();
    setOpen(next);
    if (!next) resetForm();
  }

  const activeOrigins = catalog.contactOrigins.filter((o) => o.enabled).length;

  const triggerClass = embedded
    ? "group flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-hover)] min-w-0"
    : "group flex w-full items-center gap-3 rounded-lg border border-theme bg-[var(--color-bg-card)] px-4 py-2.5 text-left transition-colors hover:border-blue-300/50 hover:bg-[var(--color-bg-hover)]";

  function addInsurer() {
    const name = newInsurer.trim();
    if (!name) return;
    if (insurers.some((i) => i.toLowerCase() === name.toLowerCase())) {
      toast.error("Esa aseguradora ya existe");
      return;
    }
    setInsurers((prev) => [...prev, name]);
    setNewInsurer("");
  }

  function save() {
    startTransition(async () => {
      const res = await updateTenantCatalogAction({ insurers, contactOrigins: origins });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Catálogos guardados");
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" onClick={() => handleOpenChange(true)} className={triggerClass}>
        <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-theme-primary truncate">Catálogos</p>
          <p className="text-xs text-theme-muted truncate">
            {catalog.insurers.length} aseguradoras · {activeOrigins} orígenes
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-theme-muted group-hover:text-blue-600 transition-colors flex-shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-[560px] p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col"
          showCloseButton={false}
        >
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Catálogos de la agencia</h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    Aseguradoras y orígenes de contacto
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
            <div className="space-y-3">
              <Label>Aseguradoras</Label>
              <div className="flex flex-wrap gap-2">
                {insurers.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-bg-elevated)] border border-theme"
                  >
                    {name}
                    <button
                      type="button"
                      className="text-theme-muted hover:text-red-600"
                      onClick={() => setInsurers((prev) => prev.filter((i) => i !== name))}
                      aria-label={`Quitar ${name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nueva aseguradora..."
                  value={newInsurer}
                  onChange={(e) => setNewInsurer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInsurer())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addInsurer}
                  className="gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Orígenes de contacto</Label>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {origins.map((origin, index) => (
                  <div
                    key={origin.value}
                    className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-theme-subtle bg-[var(--color-bg-input)]"
                  >
                    <label className="flex items-center gap-2 text-sm min-w-[120px]">
                      <input
                        type="checkbox"
                        checked={origin.enabled}
                        onChange={(e) =>
                          setOrigins((prev) =>
                            prev.map((o, i) =>
                              i === index ? { ...o, enabled: e.target.checked } : o
                            )
                          )
                        }
                      />
                      <span className="font-mono text-xs text-theme-muted">{origin.value}</span>
                    </label>
                    <Input
                      className="flex-1 min-w-[140px] h-9"
                      value={origin.label}
                      onChange={(e) =>
                        setOrigins((prev) =>
                          prev.map((o, i) => (i === index ? { ...o, label: e.target.value } : o))
                        )
                      }
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-theme-muted">
                Los orígenes desactivados no aparecerán en formularios nuevos.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center justify-end gap-2 border-t border-theme-subtle px-6 py-4 bg-[var(--color-bg-input)]/60">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={save}
              disabled={isPending || insurers.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar catálogos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
