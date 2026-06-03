"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Banknote,
  CalendarDays,
  CreditCard,
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
import { PAYMENT_METHODS } from "@/core/constants";
import { createPaymentAction } from "../actions/payment.actions";
import {
  paymentBaseSchema,
  type CreatePaymentInput,
} from "../schemas/payment.schema";

type FormValues = CreatePaymentInput;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyId: string;
  policyNumber: string;
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
  icon: typeof Banknote;
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

export function PaymentFormDialog({
  open,
  onOpenChange,
  policyId,
  policyNumber,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(paymentBaseSchema) as never,
    defaultValues: {
      policyId,
      amount: 0,
      method: "TRANSFERENCIA",
      status: "CONFIRMED",
      reference: "",
      notes: "",
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
        policyId,
        amount: 0,
        method: "TRANSFERENCIA",
        status: "CONFIRMED",
        reference: "",
        notes: "",
        paymentDate: new Date(),
      } as never);
    }
  }, [open, policyId, reset]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await createPaymentAction(values);

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

      toast.success("Pago registrado");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px] max-h-[92vh] flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 flex-shrink-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                <Banknote className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Registrar pago</h2>
                <p className="text-xs text-white/70 mt-0.5">
                  Póliza {policyNumber}
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
            <section className="space-y-3">
              <SectionTitle icon={Banknote}>Datos del pago</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label htmlFor="amount">Monto</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-theme-muted font-medium">$</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      {...register("amount", { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                  <FieldError message={errors.amount?.message} />
                </div>

                <div>
                  <Label htmlFor="paymentDate">Fecha de pago</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    defaultValue={toDateInput(new Date())}
                    {...register("paymentDate" as never, {
                      setValueAs: (v: string) => (v ? new Date(v) : undefined),
                    })}
                  />
                  <FieldError message={errors.paymentDate?.message} />
                </div>

                <div>
                  <Label htmlFor="method">Método de pago</Label>
                  <select
                    id="method"
                    {...register("method")}
                    className="crm-select"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="reference">Referencia / folio</Label>
                  <Input
                    id="reference"
                    {...register("reference")}
                    placeholder="Num. operación"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle icon={CalendarDays}>Periodo cubierto</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label htmlFor="periodStart">Desde</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    {...register("periodStart" as never, {
                      setValueAs: (v: string) => (v ? new Date(v) : null),
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="periodEnd">Hasta</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    {...register("periodEnd" as never, {
                      setValueAs: (v: string) => (v ? new Date(v) : null),
                    })}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle icon={CreditCard}>Observaciones</SectionTitle>
              <Textarea
                id="notes"
                rows={2}
                {...register("notes")}
                placeholder="Notas sobre el pago..."
              />
            </section>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-end gap-2 border-t border-theme-subtle bg-[var(--color-bg-input)]/80 px-6 py-4">
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
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white shadow-sm min-w-[140px]"
            >
              {isPending ? "Guardando..." : "Registrar pago"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
