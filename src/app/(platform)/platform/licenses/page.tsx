import { licenseService } from "@/modules/licenses/services/license.service";
import {
  GenerateLicenseForm,
  type PlanOption,
} from "@/modules/licenses/components/generate-license-form";
import { LICENSE_TERM_LABELS } from "@/core/tenant/license-term";
import { SAAS_PLAN_CATALOG } from "@/core/tenant/saas-catalog";
import { planService } from "@/modules/plans/services/plan.service";
import { PlansCatalogReference } from "@/modules/plans/components/plans-catalog-reference";

export const metadata = { title: "Licencias · Plataforma SaaS" };

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Disponible",
  USED: "Usada",
  REVOKED: "Revocada",
  EXPIRED: "Expirada",
};

export default async function PlatformLicensesPage() {
  const [licenses, plansRaw] = await Promise.all([
    licenseService.listRecent(40),
    planService.listActive(),
  ]);

  const plans: PlanOption[] = plansRaw.map((p) => ({
    slug: p.slug,
    name: p.name,
    maxUsers: p.maxUsers,
    storageLimitMb: p.storageLimitMb,
    priceMonthly: Number(p.priceMonthly),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">Licencias</h1>
        <p className="text-sm text-theme-muted">
          Genera claves por plan (2, 5 o 10 usuarios) con vigencia mensual, anual, 24 meses o 4
          años
        </p>
      </div>

      <GenerateLicenseForm plans={plans} catalog={SAAS_PLAN_CATALOG} />

      <PlansCatalogReference />

      <div className="crm-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-theme-primary">Historial reciente</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-elevated)] text-left text-theme-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Clave</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Vigencia</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Agencia</th>
                <th className="px-6 py-3 font-medium">Creada</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {licenses.map((lic) => (
                <tr key={lic.id}>
                  <td className="px-6 py-3 font-mono text-xs">{lic.code}</td>
                  <td className="px-6 py-3">
                    {lic.plan.name}
                    <span className="block text-xs text-theme-muted">
                      {lic.plan.maxUsers} usuarios
                    </span>
                  </td>
                  <td className="px-6 py-3">{LICENSE_TERM_LABELS[lic.term]}</td>
                  <td className="px-6 py-3">{STATUS_LABEL[lic.status] ?? lic.status}</td>
                  <td className="px-6 py-3">{lic.tenant?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-theme-muted">
                    {lic.createdAt.toLocaleDateString("es-MX")}
                  </td>
                </tr>
              ))}
              {licenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-theme-muted">
                    No hay licencias generadas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
