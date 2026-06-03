"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { formatPlanLabel } from "@/core/tenant/saas-catalog";
import { changeTenantPlanAction } from "@/modules/tenants/actions/tenant.actions";

type PlanOption = {
  id: string;
  name: string;
  maxUsers: number;
  storageLimitMb: number;
  priceMonthly: number;
};

interface Props {
  tenantId: string;
  currentPlanId: string;
  activeUsers: number;
  plans: PlanOption[];
}

export function ChangeTenantPlanForm({
  tenantId,
  currentPlanId,
  activeUsers,
  plans,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(planId: string) {
    if (planId === currentPlanId) return;

    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    if (activeUsers > plan.maxUsers) {
      toast.error(
        `Hay ${activeUsers} usuarios activos. El plan ${plan.name} permite ${plan.maxUsers}.`
      );
      return;
    }

    if (
      !confirm(
        `¿Cambiar al plan ${plan.name}? Se actualizarán límites de usuarios y almacenamiento.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await changeTenantPlanAction({ tenantId, planId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Plan actualizado");
      router.refresh();
    });
  }

  return (
    <div className="crm-card p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-theme-primary flex items-center gap-2">
          <ArrowUpCircle className="w-5 h-5 text-blue-600" />
          Cambiar plan comercial
        </h2>
        <p className="text-sm text-theme-muted mt-1">
          Usuarios activos: {activeUsers}. El nuevo plan debe admitir al menos esa cantidad.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Plan asignado</Label>
        <select
          className="crm-select w-full max-w-lg"
          value={currentPlanId}
          disabled={isPending}
          onChange={(e) => handleChange(e.target.value)}
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {formatPlanLabel(plan)}
              {activeUsers > plan.maxUsers ? " — usuarios excedidos" : ""}
            </option>
          ))}
        </select>
      </div>

      {isPending && (
        <p className="text-sm text-theme-muted flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Actualizando plan...
        </p>
      )}
    </div>
  );
}
