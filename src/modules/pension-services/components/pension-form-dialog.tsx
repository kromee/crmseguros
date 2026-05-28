"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  CreditCard,
  FileText,
  PiggyBank,
  Scale,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
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
import { PENSION_LAWS, PENSION_REQUEST_TYPES } from "@/core/constants";
import {
  createPensionAction,
  updatePensionAction,
} from "@/modules/pension-services/actions/pension.actions";
import {
  pensionBaseSchema,
  type CreatePensionInput,
} from "@/modules/pension-services/schemas/pension.schema";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "IN_PROGRESS", label: "En proceso" },
  { value: "COMPLETED", label: "Completado" },
  { value: "CANCELLED", label: "Cancelado" },
];

type FormValues = CreatePensionInput;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  contactId: string;
  pensionId?: string;
  defaultValues?: Partial<FormValues>;
}

function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-500 mt-1 font-medium">{message}</p>;
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof PiggyBank;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 pb-2">
      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-100">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {children}
      </span>
    </div>
  );
}

export function PensionFormDialog({
  open,
  onOpenChange,
  mode,
  contactId,
  pensionId,
  defaultValues,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(pensionBaseSchema) as never,
    defaultValues: {
      contactId,
      requestType: "ASESORIA",
      cost: 0,
      status: "PENDING",
      ...defaultValues,
    } as never,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      reset({
        contactId,
        requestType: "ASESORIA",
        cost: 0,
        status: "PENDING",
        ...defaultValues,
        requestDate: defaultValues?.requestDate ?? new Date(),
      } as never);
    }
  }, [open, contactId, defaultValues, reset]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPensionAction(values)
          : await updatePensionAction(pensionId!, values);

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

      toast.success(mode === "create" ? "Asesoría registrada" : "Servicio actualizado");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[640px] max-h-[92vh] flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-500 to-violet-600 px-6 py-5 flex-shrink-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                <PiggyBank className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {mode === "create" ? "Nueva asesoría de pensión" : "Editar servicio de pensión"}
                </h2>
                <p className="text-xs text-white/70 mt-0.5">
                  {mode === "create"
                    ? "Registra un nuevo trámite o asesoría"
                    : "Modifica los datos del servicio"}
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
        </div>

        {/* Contenido */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Datos del trámite */}
            <section className="space-y-3">
              <SectionTitle icon={Scale}>Datos del trámite</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label htmlFor="requestDate">Fecha de solicitud</Label>
                  <Input
                    id="requestDate"
                    type="date"
                    defaultValue={toDateInput(defaultValues?.requestDate as Date | undefined)}
                    {...register("requestDate" as never, {
                      setValueAs: (v: string) => (v ? new Date(v) : undefined),
                    })}
                  />
                  <FieldError message={errors.requestDate?.message} />
                </div>

                <div>
                  <Label htmlFor="requestType">Tipo de solicitud</Label>
                  <select
                    id="requestType"
                    {...register("requestType")}
                    className="crm-select"
                  >
                    {PENSION_REQUEST_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="pensionLaw">Ley aplicable</Label>
                  <select
                    id="pensionLaw"
                    {...register("pensionLaw")}
                    className="crm-select"
                  >
                    <option value="">Sin definir</option>
                    {PENSION_LAWS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
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
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Financieros */}
            <section className="space-y-3">
              <SectionTitle icon={CreditCard}>Financieros</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label htmlFor="cost">Costo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">$</span>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      {...register("cost", { valueAsNumber: true })}
                    />
                  </div>
                  <FieldError message={errors.cost?.message} />
                </div>

                <div>
                  <Label htmlFor="advance">Anticipo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">$</span>
                    <Input
                      id="advance"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      {...register("advance", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="advanceDate">Fecha de anticipo</Label>
                  <Input
                    id="advanceDate"
                    type="date"
                    defaultValue={toDateInput(defaultValues?.advanceDate as Date | undefined)}
                    {...register("advanceDate" as never, {
                      setValueAs: (v: string) => (v ? new Date(v) : undefined),
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="settlement">Liquidación</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">$</span>
                    <Input
                      id="settlement"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      {...register("settlement", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="settlementDate">Fecha de liquidación</Label>
                  <Input
                    id="settlementDate"
                    type="date"
                    defaultValue={toDateInput(defaultValues?.settlementDate as Date | undefined)}
                    {...register("settlementDate" as never, {
                      setValueAs: (v: string) => (v ? new Date(v) : undefined),
                    })}
                  />
                </div>
              </div>
            </section>

            {/* Observaciones */}
            <section className="space-y-3">
              <SectionTitle icon={FileText}>Observaciones</SectionTitle>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    rows={2}
                    {...register("description")}
                    placeholder="Resumen del trámite o asesoría"
                  />
                </div>

                <div>
                  <Label htmlFor="bitacora">Bitácora</Label>
                  <Textarea
                    id="bitacora"
                    rows={3}
                    {...register("bitacora")}
                    placeholder="Avances, llamadas, gestiones realizadas..."
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-slate-500"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:opacity-90 text-white shadow-sm min-w-[140px]"
            >
              {isPending ? "Guardando..." : mode === "create" ? "Registrar" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
