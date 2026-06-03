"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPlanLabel } from "@/core/tenant/plans";
import type { SaasPlanDefinition } from "@/core/tenant/saas-catalog";
import {
  generateLicenseSchema,
  licenseTermEnum,
  type GenerateLicenseInput,
} from "@/modules/licenses/schemas/license.schema";
import { generateLicenseAction } from "@/modules/licenses/actions/license.actions";
import { LICENSE_TERM_LABELS } from "@/core/tenant/license-term";

const TERM_OPTIONS = licenseTermEnum.options;

export type PlanOption = {
  slug: string;
  name: string;
  maxUsers: number;
  storageLimitMb: number;
  priceMonthly: number;
};

export function GenerateLicenseForm({
  plans,
  catalog,
}: {
  plans: PlanOption[];
  catalog: SaasPlanDefinition[];
}) {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const defaultPlanSlug = plans[0]?.slug ?? "plan-agencia";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GenerateLicenseInput>({
    resolver: zodResolver(generateLicenseSchema),
    defaultValues: {
      planSlug: defaultPlanSlug,
      term: "ANNUAL",
      keyValidDays: 30,
    },
  });

  const selectedPlanSlug = watch("planSlug");
  const selectedCatalog = catalog.find((p) => p.slug === selectedPlanSlug);

  async function onSubmit(data: GenerateLicenseInput) {
    setError(null);
    setGeneratedCode(null);
    setGeneratedSummary(null);

    const result = await generateLicenseAction(data);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setGeneratedCode(result.data.code);
    setGeneratedSummary(
      `${result.data.planName} · ${result.data.maxUsers} usuarios · ${result.data.term}`
    );
  }

  async function copyCode() {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
  }

  return (
    <div className="crm-card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-theme-primary">Generar licencia</h2>
        <p className="text-sm text-theme-muted">
          Elige el plan (usuarios incluidos). La clave se muestra una sola vez; el cliente la usa
          en /activar
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="planSlug">Plan comercial</Label>
          <select
            id="planSlug"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            {...register("planSlug")}
          >
            {plans.map((plan) => (
              <option key={plan.slug} value={plan.slug}>
                {formatPlanLabel(plan)}
              </option>
            ))}
          </select>
          {errors.planSlug && (
            <p className="text-xs text-red-600">{errors.planSlug.message}</p>
          )}
          {selectedCatalog && (
            <p className="text-xs text-theme-muted">{selectedCatalog.description}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="term">Vigencia al activar</Label>
          <select
            id="term"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            {...register("term")}
          >
            {TERM_OPTIONS.map((term) => (
              <option key={term} value={term}>
                {LICENSE_TERM_LABELS[term]}
              </option>
            ))}
          </select>
          {errors.term && <p className="text-xs text-red-600">{errors.term.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="keyValidDays">Días para usar la clave (opcional)</Label>
          <Input
            id="keyValidDays"
            type="number"
            min={1}
            max={365}
            {...register("keyValidDays", {
              setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
            })}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notes">Notas internas</Label>
          <Input id="notes" placeholder="Cliente prospecto, fecha llamada..." {...register("notes")} />
        </div>

        {error && (
          <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {generatedCode && (
          <div className="sm:col-span-2 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800 mb-1">Licencia generada</p>
            {generatedSummary && (
              <p className="text-xs text-green-700 mb-2">{generatedSummary}</p>
            )}
            <div className="flex items-center gap-2">
              <code className="flex-1 text-lg font-mono tracking-wider text-green-900">
                {generatedCode}
              </code>
              <Button type="button" variant="outline" size="sm" onClick={copyCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Generar clave
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
