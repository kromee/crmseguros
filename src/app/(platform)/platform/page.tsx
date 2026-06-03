import Link from "next/link";
import { tenantService } from "@/modules/tenants/services/tenant.service";
import { LICENSE_TERM_LABELS } from "@/core/tenant/license-term";
import { formatDate } from "@/core/utils/format";
import { TenantStatusBadge } from "@/modules/tenants/components/tenant-status-badge";

export const metadata = { title: "Plataforma SaaS" };

export default async function PlatformHomePage() {
  const stats = await tenantService.getPlatformStats();

  const recentTenants = await tenantService.list({ page: 1, pageSize: 5, status: "ALL" });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">Panel de plataforma</h1>
        <p className="text-sm text-theme-muted">Gestión de clientes SaaS y licencias</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Agencias totales</p>
          <p className="text-3xl font-bold text-theme-primary">{stats.total}</p>
        </div>
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Activas</p>
          <p className="text-3xl font-bold text-green-700">{stats.active}</p>
        </div>
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Suspendidas</p>
          <p className="text-3xl font-bold text-amber-700">{stats.suspended}</p>
        </div>
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Por vencer (30 d)</p>
          <p className="text-3xl font-bold text-orange-600">{stats.expiringSoon}</p>
        </div>
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Licencias libres</p>
          <p className="text-3xl font-bold text-blue-700">{stats.licensesAvailable}</p>
        </div>
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Licencias usadas</p>
          <p className="text-3xl font-bold text-theme-primary">{stats.licensesUsed}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/platform/tenants"
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Ver agencias
        </Link>
        <Link
          href="/platform/licenses"
          className="px-4 py-2 text-sm rounded-lg border border-theme bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)]"
        >
          Gestionar licencias
        </Link>
      </div>

      <div className="crm-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-theme-primary">Últimas agencias</h2>
          <Link href="/platform/tenants" className="text-sm text-blue-600 hover:underline">
            Ver todas
          </Link>
        </div>
        {recentTenants.items.length === 0 ? (
          <p className="text-sm text-theme-muted">Sin agencias registradas aún.</p>
        ) : (
          <ul className="divide-y">
            {recentTenants.items.map((t) => {
              const sub = t.subscriptions[0];
              return (
                <li key={t.id} className="py-3 flex justify-between gap-4 text-sm">
                  <div>
                    <Link
                      href={`/platform/tenants/${t.id}`}
                      className="font-medium text-theme-primary hover:text-blue-600"
                    >
                      {t.name}
                    </Link>
                    <p className="text-theme-muted">
                      {t.plan.name} · {t.slug}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <TenantStatusBadge status={t.status} />
                    {sub && (
                      <p className="text-theme-muted text-xs">
                        {LICENSE_TERM_LABELS[sub.term]} · vence {formatDate(sub.expiresAt)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
