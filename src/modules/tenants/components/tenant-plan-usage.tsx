import { AlertTriangle } from "lucide-react";
import type { TenantEntitlements } from "@/core/tenant/entitlements";
import { formatDate } from "@/core/utils/format";

function formatStorageLimit(mb: number): string {
  if (mb >= 1024 && mb % 512 === 0) {
    return `${mb / 1024} GB (${mb.toLocaleString("es-MX")} MB)`;
  }
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB (${mb.toLocaleString("es-MX")} MB)`;
  }
  return `${mb.toLocaleString("es-MX")} MB`;
}

export function TenantPlanUsageCard({ entitlements }: { entitlements: TenantEntitlements }) {
  const userPercent = Math.min(
    100,
    Math.round((entitlements.activeUsers / entitlements.maxUsers) * 100)
  );

  return (
    <div className="crm-card p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-theme-primary">Plan y límites</h2>
        <p className="text-sm text-theme-muted">
          {entitlements.planName} · {entitlements.tenantName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-theme-secondary">Usuarios activos</span>
            <span className="font-medium text-theme-primary">
              {entitlements.activeUsers}/{entitlements.maxUsers}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
            <div
              className={`h-full rounded-full ${userPercent >= 100 ? "bg-red-500" : "bg-blue-600"}`}
              style={{ width: `${userPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-theme-secondary">Almacenamiento</span>
            <span className="font-medium text-theme-primary">
              {entitlements.storageUsedMb} / {formatStorageLimit(entitlements.storageLimitMb)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
            <div
              className={`h-full rounded-full ${
                entitlements.storagePercent >= 90 ? "bg-amber-500" : "bg-indigo-600"
              }`}
              style={{ width: `${entitlements.storagePercent}%` }}
            />
          </div>
        </div>
      </div>

      {entitlements.subscriptionExpiresAt && (
        <p className="text-sm text-theme-secondary">
          Suscripción vigente hasta{" "}
          <span className="font-medium">{formatDate(entitlements.subscriptionExpiresAt)}</span>
          {entitlements.daysUntilExpiry !== null && entitlements.daysUntilExpiry <= 30 && (
            <span className="text-amber-700"> ({entitlements.daysUntilExpiry} días restantes)</span>
          )}
        </p>
      )}

      {!entitlements.canAddUser && (
        <p className="text-sm text-theme-secondary bg-[var(--color-bg-input)] border border-theme rounded-lg px-3 py-2">
          Tu plan incluye {entitlements.maxUsers} usuarios activos y ya los estás usando (
          {entitlements.activeUsers}/{entitlements.maxUsers}). Para agregar otro, desactiva uno
          existente o contacta soporte para ampliar el plan.
        </p>
      )}

      {entitlements.storagePercent >= 90 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          Almacenamiento casi lleno. Elimina archivos antiguos o solicita ampliación.
        </p>
      )}
    </div>
  );
}

export function TenantUsageAlerts({ entitlements }: { entitlements: TenantEntitlements }) {
  const alerts: string[] = [];

  if (entitlements.daysUntilExpiry !== null && entitlements.daysUntilExpiry <= 30 && entitlements.daysUntilExpiry > 0) {
    alerts.push(
      `Tu suscripción vence en ${entitlements.daysUntilExpiry} días (${formatDate(entitlements.subscriptionExpiresAt!)}).`
    );
  }
  if (entitlements.storagePercent >= 90) {
    alerts.push(
      `Almacenamiento al ${entitlements.storagePercent}% (${entitlements.storageUsedMb}/${entitlements.storageLimitMb} MB).`
    );
  }

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="space-y-1">
          {alerts.map((alert) => (
            <p key={alert}>{alert}</p>
          ))}
          <p className="text-xs text-amber-800 pt-1">
            Contacta soporte para renovar o ampliar tu plan.
          </p>
        </div>
      </div>
    </div>
  );
}
