"use client";

import {
  Banknote,
  CalendarDays,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PAYMENT_METHODS, PAYMENT_STATUS_LABELS } from "@/core/constants";
import { formatCurrency } from "@/core/utils/format";
import { deletePaymentAction } from "../actions/payment.actions";
import { PaymentFormDialog } from "./payment-form-dialog";

export interface PaymentDTO {
  id: string;
  amount: number;
  paymentDate: string;
  periodStart: string | null;
  periodEnd: string | null;
  method: string;
  reference: string | null;
  notes: string | null;
  status: string;
}

interface Props {
  policyId: string;
  policyNumber: string;
  payments: PaymentDTO[];
  totalPaid: number;
  premium: number;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    CONFIRMED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${colors[status] || "bg-slate-100 text-slate-600"}`}
    >
      {PAYMENT_STATUS_LABELS[status] || status}
    </span>
  );
}

export function PaymentsList({
  policyId,
  policyNumber,
  payments,
  totalPaid,
  premium,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete(paymentId: string) {
    if (!confirm("¿Eliminar este pago?")) return;
    startTransition(async () => {
      const result = await deletePaymentAction(paymentId, policyId);
      if (result.ok) {
        toast.success("Pago eliminado");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const methodLabel = (value: string) =>
    PAYMENT_METHODS.find((m) => m.value === value)?.label || value;

  const paidPercent = premium > 0 ? Math.min(100, (totalPaid / premium) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Barra de progreso */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Pagos vs Prima
            </span>
            <span className="text-xs font-bold text-slate-700">
              {formatCurrency(totalPaid)} / {formatCurrency(premium)}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Pago
        </button>
      </div>

      {/* Lista */}
      {payments.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400">
          <Banknote className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          Sin pagos registrados
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-100 hover:border-slate-200 transition-colors group"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 flex-shrink-0">
                <Banknote className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-slate-800">
                    {formatCurrency(p.amount)}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <CalendarDays className="w-3 h-3" />
                  {new Date(p.paymentDate).toLocaleDateString("es-MX")}
                  <span className="text-slate-300">·</span>
                  {methodLabel(p.method)}
                  {p.reference && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="truncate max-w-[120px]">Ref: {p.reference}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(p.id)}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Eliminar pago"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <PaymentFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        policyId={policyId}
        policyNumber={policyNumber}
      />
    </div>
  );
}
