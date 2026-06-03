"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PauseCircle, PlayCircle } from "lucide-react";
import type { TenantStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { updateTenantStatusAction } from "../actions/tenant.actions";

export function TenantStatusActions({
  tenantId,
  status,
}: {
  tenantId: string;
  status: TenantStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"suspend" | "activate" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(next: "ACTIVE" | "SUSPENDED") {
    setError(null);
    setLoading(next === "SUSPENDED" ? "suspend" : "activate");

    const result = await updateTenantStatusAction({ tenantId, status: next });
    setLoading(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "ACTIVE" && (
          <Button
            type="button"
            variant="outline"
            disabled={loading !== null}
            onClick={() => changeStatus("SUSPENDED")}
            className="text-amber-700 border-amber-200 hover:bg-amber-50"
          >
            {loading === "suspend" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PauseCircle className="w-4 h-4 mr-2" />
            )}
            Suspender agencia
          </Button>
        )}

        {status === "SUSPENDED" && (
          <Button
            type="button"
            disabled={loading !== null}
            onClick={() => changeStatus("ACTIVE")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading === "activate" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-2" />
            )}
            Reactivar agencia
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {status === "ACTIVE" && (
        <p className="text-xs text-theme-muted">
          Al suspender, los usuarios de la agencia no podrán iniciar sesión.
        </p>
      )}
    </div>
  );
}
