"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Car,
  CalendarDays,
  CreditCard,
  FileText,
  Heart,
  Shield,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  COVERAGE_TYPES,
  CURRENCIES,
  INSURERS,
  PAYMENT_FREQUENCIES,
  POLICY_STATUS_LABELS,
  POLICY_TYPES,
} from "@/core/constants";
import {
  createPolicyAction,
  renewPolicyAction,
  updatePolicyAction,
} from "@/modules/policies/actions/policy.actions";
import { getTenantCatalogAction } from "@/modules/tenants/actions/tenant-catalog.actions";
import { PolicyFileUpload } from "./policy-file-upload";
import { PolicyVehiclePhotoUpload } from "./policy-vehicle-photo-upload";
import {
  policyBaseSchema,
  type CreatePolicyInput,
} from "@/modules/policies/schemas/policy.schema";

type FormValues = CreatePolicyInput;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit" | "renew";
  contactId: string;
  policyId?: string;
  defaultValues?: Partial<FormValues>;
  policyFile?: string | null;
  vehiclePhoto?: string | null;
  insurers?: readonly string[];
  filesReadOnly?: boolean;
}

function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

const TYPE_CONFIG = {
  VIDA: {
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    lightBg: "bg-rose-50",
    lightText: "text-rose-700",
    lightBorder: "border-rose-200",
    ring: "ring-rose-500/20",
    label: "Vida",
  },
  AUTO: {
    icon: Car,
    gradient: "from-blue-500 to-indigo-600",
    lightBg: "bg-blue-50",
    lightText: "text-blue-700",
    lightBorder: "border-blue-200",
    ring: "ring-blue-500/20",
    label: "Auto",
  },
  OTRO: {
    icon: FileText,
    gradient: "from-slate-500 to-slate-700",
    lightBg: "bg-[var(--color-bg-input)]",
    lightText: "text-theme-secondary",
    lightBorder: "border-theme",
    ring: "ring-slate-500/20",
    label: "Otro",
  },
} as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-500 mt-1 font-medium">{message}</p>;
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof Shield;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 pb-2">
      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--color-bg-elevated)]">
        <Icon className="w-3.5 h-3.5 text-theme-muted" />
      </div>
      <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
        {children}
      </span>
    </div>
  );
}

export function PolicyFormDialog({
  open,
  onOpenChange,
  mode,
  contactId,
  policyId,
  defaultValues,
  policyFile = null,
  vehiclePhoto = null,
  insurers = INSURERS,
  filesReadOnly = false,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [insurerOptions, setInsurerOptions] = useState<string[]>(() => [...insurers]);
  const [loadingInsurers, setLoadingInsurers] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(policyBaseSchema) as never,
    defaultValues: {
      contactId,
      policyNumber: "",
      type: "VIDA",
      plan: "",
      insurer: "",
      paymentFrequency: "ANUAL",
      premium: 0,
      status: "ACTIVE",
      notes: "",
      beneficiaries: "",
      insuredAsset: "",
      coverageType: null,
      currency: "MXN",
      term: "",
      ...defaultValues,
    } as never,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const selectedType = watch("type") as keyof typeof TYPE_CONFIG;
  const selectedInsurer = watch("insurer");
  const config = TYPE_CONFIG[selectedType] ?? TYPE_CONFIG.OTRO;
  const Icon = config.icon;

  const insurerList = useMemo(() => {
    const names = new Set(insurerOptions);
    if (selectedInsurer?.trim()) names.add(selectedInsurer.trim());
    return Array.from(names);
  }, [insurerOptions, selectedInsurer]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingInsurers(true);
    void getTenantCatalogAction()
      .then((catalog) => {
        if (cancelled || catalog.insurers.length === 0) return;
        setInsurerOptions(catalog.insurers);
      })
      .finally(() => {
        if (!cancelled) setLoadingInsurers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      reset({
        contactId,
        policyNumber: "",
        type: "VIDA",
        plan: "",
        insurer: "",
        paymentFrequency: "ANUAL",
        premium: 0,
        status: "ACTIVE",
        notes: "",
        beneficiaries: "",
        insuredAsset: "",
        coverageType: null,
        currency: "MXN",
        term: "",
        ...defaultValues,
        startDate: defaultValues?.startDate ?? new Date(),
        endDate: defaultValues?.endDate ?? new Date(),
      } as never);
    }
  }, [open, contactId, defaultValues, reset]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      let result;
      if (mode === "renew") {
        result = await renewPolicyAction(policyId!, values);
      } else if (mode === "create") {
        result = await createPolicyAction(values);
      } else {
        result = await updatePolicyAction(policyId!, values);
      }

      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([key, msgs]) => {
            const msg = msgs?.[0];
            if (msg) form.setError(key as keyof FormValues, { message: msg });
          });
        }
        return;
      }

      const messages = {
        create: "Póliza registrada exitosamente",
        edit: "Póliza actualizada",
        renew: "Póliza renovada exitosamente",
      };
      toast.success(messages[mode]);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[680px] max-h-[92vh] flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        {/* ─── Header con gradiente dinámico ─── */}
        <div className={`relative bg-gradient-to-r ${config.gradient} px-6 py-5 flex-shrink-0`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {mode === "renew" ? "Renovar póliza" : mode === "create" ? "Nueva póliza" : "Editar póliza"}
                </h2>
                <p className="text-xs text-white/70 mt-0.5">
                  {mode === "renew"
                    ? "Se creará una nueva póliza y la anterior quedará como vencida"
                    : mode === "create"
                      ? "Registra una nueva póliza de seguro"
                      : "Modifica los datos de la póliza"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-white/80 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Selector de tipo dentro del header */}
          <div className="relative mt-4 grid grid-cols-3 gap-2">
            {POLICY_TYPES.map((t) => {
              const tc = TYPE_CONFIG[t.value as keyof typeof TYPE_CONFIG];
              const TIcon = tc.icon;
              const active = selectedType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setValue("type", t.value)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? "bg-[var(--color-bg-card)] text-theme-primary shadow-md"
                      : "bg-white/15 text-white/90 hover:bg-white/25 backdrop-blur-sm"
                  }`}
                >
                  <TIcon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Contenido scrolleable ─── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Datos generales */}
            <section className="space-y-3">
              <SectionTitle icon={Shield}>Datos generales</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label htmlFor="policyNumber">Número de póliza</Label>
                  <Input
                    id="policyNumber"
                    {...register("policyNumber")}
                    placeholder="Ej. VID-2026-001"
                  />
                  <FieldError message={errors.policyNumber?.message} />
                </div>

                <div>
                  <Label htmlFor="insurer">Aseguradora</Label>
                  <select
                    id="insurer"
                    {...register("insurer")}
                    className="crm-select"
                    disabled={loadingInsurers}
                  >
                    <option value="">
                      {loadingInsurers ? "Cargando aseguradoras..." : "Seleccionar"}
                    </option>
                    {insurerList.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="status">Estado</Label>
                  <select
                    id="status"
                    {...register("status")}
                    className="crm-select"
                  >
                    {Object.entries(POLICY_STATUS_LABELS).map(([value, lbl]) => (
                      <option key={value} value={value}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Vigencia y pagos */}
            <section className="space-y-3">
              <SectionTitle icon={CalendarDays}>Vigencia y pagos</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label htmlFor="startDate">Inicio de vigencia</Label>
                  <Input
                    id="startDate"
                    type="date"
                    defaultValue={toDateInput(defaultValues?.startDate as Date | undefined)}
                    {...register("startDate" as never, {
                      setValueAs: (v: string) => (v ? new Date(v) : undefined),
                    })}
                  />
                  <FieldError message={errors.startDate?.message} />
                </div>

                <div>
                  <Label htmlFor="endDate">Término de vigencia</Label>
                  <Input
                    id="endDate"
                    type="date"
                    defaultValue={toDateInput(defaultValues?.endDate as Date | undefined)}
                    {...register("endDate" as never, {
                      setValueAs: (v: string) => (v ? new Date(v) : undefined),
                    })}
                  />
                  <FieldError message={errors.endDate?.message} />
                </div>

                <div>
                  <Label htmlFor="paymentFrequency">Forma de pago</Label>
                  <select
                    id="paymentFrequency"
                    {...register("paymentFrequency")}
                    className="crm-select"
                  >
                    {PAYMENT_FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="premium">Prima</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-theme-muted font-medium">$</span>
                    <Input
                      id="premium"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      {...register("premium", { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                  <FieldError message={errors.premium?.message} />
                </div>
              </div>
            </section>

            {/* ─── Sección dinámica: AUTO ─── */}
            {selectedType === "AUTO" && (
              <section className={`space-y-3 p-4 rounded-xl ${config.lightBg} border ${config.lightBorder}`}>
                <div className="flex items-center gap-2 pb-1">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-md ${config.lightBg}`}>
                    <Car className={`w-3.5 h-3.5 ${config.lightText}`} />
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${config.lightText}`}>
                    Seguro de auto
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="col-span-2">
                    <Label htmlFor="insuredAsset">Bienes asegurados</Label>
                    <Textarea
                      id="insuredAsset"
                      rows={2}
                      {...register("insuredAsset")}
                      placeholder="Ej. Nissan Sentra 2024 Blanco, placas ABC-1234, Serie: ..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="coverageType">Cobertura</Label>
                    <select
                      id="coverageType"
                      {...register("coverageType")}
                      className="crm-select"
                    >
                      <option value="">Seleccionar</option>
                      {COVERAGE_TYPES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="sumInsured">Suma asegurada</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-theme-muted font-medium">$</span>
                      <Input
                        id="sumInsured"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        {...register("sumInsured", { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {policyId && mode === "edit" && selectedType === "AUTO" && (
                    <div className="col-span-2 pt-2 border-t border-blue-200/60">
                      <PolicyVehiclePhotoUpload
                        policyId={policyId}
                        vehiclePhoto={vehiclePhoto}
                        compact
                        readOnly={filesReadOnly}
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ─── Sección dinámica: VIDA ─── */}
            {selectedType === "VIDA" && (
              <section className={`space-y-3 p-4 rounded-xl ${config.lightBg} border ${config.lightBorder}`}>
                <div className="flex items-center gap-2 pb-1">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-md ${config.lightBg}`}>
                    <Heart className={`w-3.5 h-3.5 ${config.lightText}`} />
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${config.lightText}`}>
                    Seguro de vida
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <Label htmlFor="plan">Nombre del plan</Label>
                    <Input
                      id="plan"
                      {...register("plan")}
                      placeholder="Ej. Vida Integral Plus"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency">Moneda</Label>
                    <select
                      id="currency"
                      {...register("currency")}
                      className="crm-select"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="term">Plazo</Label>
                    <Input
                      id="term"
                      {...register("term")}
                      placeholder="Ej. 20 años, Vitalicio"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sumInsured">Suma asegurada</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-theme-muted font-medium">$</span>
                      <Input
                        id="sumInsured"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        {...register("sumInsured", { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="beneficiaries">Beneficiarios</Label>
                    <Textarea
                      id="beneficiaries"
                      rows={2}
                      {...register("beneficiaries")}
                      placeholder="Nombre completo y parentesco de beneficiarios"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ─── Sección dinámica: OTRO ─── */}
            {selectedType === "OTRO" && (
              <section className="space-y-3 p-4 rounded-xl bg-[var(--color-bg-input)] border border-theme">
                <div className="flex items-center gap-2 pb-1">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--color-bg-elevated)]">
                    <Sparkles className="w-3.5 h-3.5 text-theme-muted" />
                  </div>
                  <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Detalles del seguro
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <Label htmlFor="plan">Plan / producto</Label>
                    <Input id="plan" {...register("plan")} placeholder="Ej. GMM Familiar" />
                  </div>

                  <div>
                    <Label htmlFor="sumInsured">Suma asegurada</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-theme-muted font-medium">$</span>
                      <Input
                        id="sumInsured"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        {...register("sumInsured", { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="beneficiaries">Beneficiarios</Label>
                    <Textarea
                      id="beneficiaries"
                      rows={2}
                      {...register("beneficiaries")}
                      placeholder="Nombre completo y parentesco de beneficiarios"
                    />
                  </div>
                </div>
              </section>
            )}

            {policyId && mode === "edit" && (
              <section className="space-y-3">
                <SectionTitle icon={FileText}>Documentos</SectionTitle>
                <PolicyFileUpload
                  policyId={policyId}
                  policyFile={policyFile}
                  readOnly={filesReadOnly}
                />
              </section>
            )}

            {/* Notas */}
            <section className="space-y-3">
              <SectionTitle icon={CreditCard}>Observaciones</SectionTitle>
              <Textarea
                id="notes"
                rows={2}
                {...register("notes")}
                placeholder="Notas internas, detalles del siniestro, condiciones especiales..."
              />
            </section>
          </div>

          {/* ─── Footer sticky ─── */}
          <div className="flex-shrink-0 flex items-center justify-between gap-3 border-t border-theme-subtle bg-[var(--color-bg-input)]/80 px-6 py-4">
            <p className="text-[11px] text-theme-muted hidden sm:block">
              Los campos marcados son obligatorios
            </p>
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-theme-muted"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className={`bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white shadow-sm min-w-[140px]`}
              >
                {isPending
                  ? "Guardando..."
                  : mode === "renew"
                    ? "Renovar póliza"
                    : mode === "create"
                      ? "Registrar póliza"
                      : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
