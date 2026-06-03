"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LICENSE_TERM_LABELS } from "@/core/tenant/license-term";
import { licenseTermEnum } from "@/modules/licenses/schemas/license.schema";
import { renewSubscriptionSchema } from "../schemas/tenant.schema";
import { renewSubscriptionAction } from "../actions/tenant.actions";
import type { z } from "zod";

const TERM_OPTIONS = licenseTermEnum.options;
const termSchema = renewSubscriptionSchema.pick({ term: true });
type FormInput = z.infer<typeof termSchema>;

export function RenewSubscriptionForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(termSchema),
    defaultValues: { term: "ANNUAL" },
  });

  async function onSubmit(data: FormInput) {
    setError(null);
    setSuccess(null);

    const result = await renewSubscriptionAction({ tenantId, term: data.term });
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(
      `Suscripción renovada. Vence el ${new Date(result.data.expiresAt).toLocaleDateString("es-MX")}.`
    );
    router.refresh();
  }

  return (
    <div className="crm-card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-theme-primary">Renovar suscripción</h2>
        <p className="text-sm text-theme-muted">
          Crea un nuevo periodo. Si hay vigencia restante, el nuevo periodo inicia al vencer la
          actual.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="space-y-1.5 flex-1 w-full">
          <Label htmlFor="term">Vigencia</Label>
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
        </div>

        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Renovando...
            </>
          ) : (
            <>
              <CalendarPlus className="w-4 h-4 mr-2" />
              Renovar
            </>
          )}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {success}
        </p>
      )}
    </div>
  );
}
