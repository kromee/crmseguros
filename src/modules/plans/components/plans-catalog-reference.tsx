import { formatPlanStorage } from "@/core/tenant/saas-catalog";
import { planService } from "@/modules/plans/services/plan.service";

export async function PlansCatalogReference() {
  const catalog = planService.listCatalog();

  return (
    <div className="crm-card overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="font-semibold text-theme-primary">Catálogo comercial (configuración)</h2>
        <p className="text-sm text-theme-muted">
          Datos maestros sincronizados a producción con{" "}
          <code className="text-xs bg-[var(--color-bg-elevated)] px-1 rounded">npm run db:sync-catalog</code>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-bg-elevated)] text-left text-theme-muted">
            <tr>
              <th className="px-6 py-3 font-medium">Plan</th>
              <th className="px-6 py-3 font-medium">Usuarios</th>
              <th className="px-6 py-3 font-medium">Almacenamiento</th>
              <th className="px-6 py-3 font-medium">Mensualidad</th>
              <th className="px-6 py-3 font-medium">Slug / ID</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {catalog.map((plan) => (
              <tr key={plan.slug}>
                <td className="px-6 py-3">
                  <p className="font-medium text-theme-primary">{plan.name}</p>
                  <p className="text-xs text-theme-muted">{plan.description}</p>
                </td>
                <td className="px-6 py-3">{plan.maxUsers}</td>
                <td className="px-6 py-3">{formatPlanStorage(plan.storageLimitMb)}</td>
                <td className="px-6 py-3">
                  ${plan.priceMonthly.toLocaleString("es-MX")} MXN
                </td>
                <td className="px-6 py-3 text-xs text-theme-muted font-mono">
                  {plan.slug}
                  <br />
                  {plan.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
