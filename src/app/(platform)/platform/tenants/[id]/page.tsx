import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdminSession } from "@/core/tenant/session";
import { LICENSE_TERM_LABELS } from "@/core/tenant/license-term";
import { SUBSCRIPTION_STATUS_LABELS, TENANT_STATUS_LABELS } from "@/core/tenant/labels";
import { formatDate, formatDateTime, getDaysUntilExpiry } from "@/core/utils/format";
import { getTenantEntitlements } from "@/core/tenant/entitlements";
import { tenantService } from "@/modules/tenants/services/tenant.service";
import { TenantStatusBadge } from "@/modules/tenants/components/tenant-status-badge";
import { TenantStatusActions } from "@/modules/tenants/components/tenant-status-actions";
import { RenewSubscriptionForm } from "@/modules/tenants/components/renew-subscription-form";
import { ChangeTenantPlanForm } from "@/modules/tenants/components/change-tenant-plan-form";
import { PlatformTenantUsersTable } from "@/modules/tenants/components/platform-tenant-users-table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/infrastructure/prisma/client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const tenant = await tenantService.getById(id);
    return { title: `${tenant.name} · Plataforma SaaS` };
  } catch {
    return { title: "Agencia · Plataforma SaaS" };
  }
}

export default async function PlatformTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdminSession();
  const { id } = await params;

  let tenant;
  let entitlements;
  let plans;
  try {
    tenant = await tenantService.getById(id);
    entitlements = await getTenantEntitlements(id);
    plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { maxUsers: "asc" },
    });
  } catch {
    notFound();
  }

  const currentSub = tenant.subscriptions.find((s) =>
    ["ACTIVE", "SUSPENDED", "TRIAL"].includes(s.status)
  );
  const daysLeft = currentSub ? getDaysUntilExpiry(currentSub.expiresAt) : null;
  const license = tenant.licenses[0];
  const planOptions = plans.map((p) => ({
    id: p.id,
    name: p.name,
    maxUsers: p.maxUsers,
    storageLimitMb: p.storageLimitMb,
    priceMonthly: Number(p.priceMonthly),
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/platform/tenants"
          className="inline-flex items-center gap-1 text-sm text-theme-muted hover:text-blue-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a agencias
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary">{tenant.name}</h1>
            <p className="text-sm text-theme-muted">
              {tenant.slug} · {tenant.plan.name}
            </p>
          </div>
          <TenantStatusBadge status={tenant.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Usuarios activos</p>
          <p className="text-2xl font-bold text-theme-primary">
            {entitlements.activeUsers}/{entitlements.maxUsers}
          </p>
        </div>
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Contactos</p>
          <p className="text-2xl font-bold text-theme-primary">{tenant._count.contacts}</p>
        </div>
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Pólizas</p>
          <p className="text-2xl font-bold text-theme-primary">{tenant._count.policies}</p>
        </div>
        <div className="crm-card p-5">
          <p className="text-sm text-theme-muted">Almacenamiento</p>
          <p className="text-2xl font-bold text-theme-primary">
            {entitlements.storageUsedMb}/{entitlements.storageLimitMb} MB
          </p>
          <p className="text-xs text-theme-muted mt-1">{entitlements.storagePercent}% usado</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="crm-card p-6 space-y-4">
          <h2 className="font-semibold text-theme-primary">Suscripción actual</h2>
          {currentSub ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-theme-muted">Estado</dt>
                <dd>
                  <Badge variant="outline">{SUBSCRIPTION_STATUS_LABELS[currentSub.status]}</Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-theme-muted">Vigencia</dt>
                <dd>{LICENSE_TERM_LABELS[currentSub.term]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-theme-muted">Inicio</dt>
                <dd>{formatDate(currentSub.startsAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-theme-muted">Vencimiento</dt>
                <dd>
                  {formatDate(currentSub.expiresAt)}
                  {daysLeft !== null && (
                    <span
                      className={
                        daysLeft < 0
                          ? " text-red-600"
                          : daysLeft <= 30
                            ? " text-amber-600"
                            : " text-theme-muted"
                      }
                    >
                      {" "}
                      ({daysLeft < 0 ? "vencida" : `${daysLeft} días restantes`})
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-theme-muted">Sin suscripción vigente.</p>
          )}

          {license && (
            <div className="pt-4 border-t text-sm">
              <p className="text-theme-muted mb-1">Licencia de activación</p>
              <p className="font-mono text-xs">{license.code}</p>
              {license.usedAt && (
                <p className="text-xs text-theme-muted mt-1">
                  Usada el {formatDateTime(license.usedAt)}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="crm-card p-6 space-y-4">
          <h2 className="font-semibold text-theme-primary">Acciones</h2>
          <p className="text-sm text-theme-muted">
            Estado de la agencia: {TENANT_STATUS_LABELS[tenant.status]}
          </p>
          {(tenant.status === "ACTIVE" || tenant.status === "SUSPENDED") && (
            <TenantStatusActions tenantId={tenant.id} status={tenant.status} />
          )}
          {tenant.status === "PENDING" && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Agencia pendiente de activación completa.
            </p>
          )}
        </div>
      </div>

      <RenewSubscriptionForm tenantId={tenant.id} />

      <ChangeTenantPlanForm
        tenantId={tenant.id}
        currentPlanId={tenant.planId}
        activeUsers={entitlements.activeUsers}
        plans={planOptions}
      />

      <div className="crm-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-theme-primary">Historial de suscripciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-elevated)] text-left text-theme-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Vigencia</th>
                <th className="px-6 py-3 font-medium">Periodo</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenant.subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-6 py-3">{sub.plan.name}</td>
                  <td className="px-6 py-3">{LICENSE_TERM_LABELS[sub.term]}</td>
                  <td className="px-6 py-3 text-theme-muted">
                    {formatDate(sub.startsAt)} — {formatDate(sub.expiresAt)}
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant="outline">{SUBSCRIPTION_STATUS_LABELS[sub.status]}</Badge>
                  </td>
                  <td className="px-6 py-3 text-theme-muted">{formatDate(sub.createdAt)}</td>
                </tr>
              ))}
              {tenant.subscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-theme-muted">
                    Sin historial
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="crm-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-theme-primary">Usuarios de la agencia</h2>
          <p className="text-xs text-theme-muted mt-1">
            Super admin puede restablecer la contraseña de administradores de agencia (TENANT_ADMIN).
          </p>
        </div>
        <PlatformTenantUsersTable users={tenant.users} />
      </div>
    </div>
  );
}
