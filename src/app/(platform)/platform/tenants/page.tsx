import Link from "next/link";
import { Suspense } from "react";
import { requireSuperAdminSession } from "@/core/tenant/session";
import { LICENSE_TERM_LABELS } from "@/core/tenant/license-term";
import { formatDate, getDaysUntilExpiry } from "@/core/utils/format";
import { listTenantsSchema } from "@/modules/tenants/schemas/tenant.schema";
import { tenantService } from "@/modules/tenants/services/tenant.service";
import { TenantStatusBadge } from "@/modules/tenants/components/tenant-status-badge";
import { TenantsToolbar } from "@/modules/tenants/components/tenants-toolbar";
import { TenantsPagination } from "@/modules/tenants/components/tenants-pagination";

export const metadata = { title: "Agencias · Plataforma SaaS" };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlatformTenantsPage({ searchParams }: PageProps) {
  await requireSuperAdminSession();

  const raw = await searchParams;
  const parsed = listTenantsSchema.safeParse({
    status: typeof raw.status === "string" ? raw.status : undefined,
    q: typeof raw.q === "string" ? raw.q : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
  });

  const input = parsed.success ? parsed.data : listTenantsSchema.parse({});
  const { items, total, page, pageSize } = await tenantService.list(input);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">Agencias</h1>
        <p className="text-sm text-theme-muted">
          Clientes SaaS registrados · {total} en total
        </p>
      </div>

      <Suspense fallback={null}>
        <TenantsToolbar />
      </Suspense>

      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-elevated)] text-left text-theme-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Agencia</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Usuarios</th>
                <th className="px-6 py-3 font-medium">Suscripción</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((tenant) => {
                const sub = tenant.subscriptions[0];
                const daysLeft = sub ? getDaysUntilExpiry(sub.expiresAt) : null;

                return (
                  <tr key={tenant.id} className="hover:bg-[var(--color-bg-hover)]">
                    <td className="px-6 py-3">
                      <Link
                        href={`/platform/tenants/${tenant.id}`}
                        className="font-medium text-theme-primary hover:text-blue-600"
                      >
                        {tenant.name}
                      </Link>
                      <p className="text-xs text-theme-muted">{tenant.slug}</p>
                    </td>
                    <td className="px-6 py-3">{tenant.plan.name}</td>
                    <td className="px-6 py-3">
                      {tenant._count.users}/{tenant.maxUsers}
                    </td>
                    <td className="px-6 py-3">
                      {sub ? (
                        <div>
                          <p>{LICENSE_TERM_LABELS[sub.term]}</p>
                          <p className="text-xs text-theme-muted">
                            Vence {formatDate(sub.expiresAt)}
                            {daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && (
                              <span className="text-amber-600 ml-1">({daysLeft} días)</span>
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-theme-muted">Sin suscripción</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <TenantStatusBadge status={tenant.status} />
                    </td>
                    <td className="px-6 py-3 text-theme-muted">
                      {formatDate(tenant.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-theme-muted">
                    No hay agencias con estos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <Suspense fallback={null}>
            <TenantsPagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
