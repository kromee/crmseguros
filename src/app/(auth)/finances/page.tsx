import { requireTenantSession } from "@/core/tenant";
import { financeService } from "@/modules/payments/services/finance.service";
import { FinanceDashboard } from "@/modules/payments/components/finance-dashboard";

export const dynamic = "force-dynamic";

export default async function FinancesPage() {
  const { tenantId } = await requireTenantSession();

  const year = new Date().getFullYear();
  const data = await financeService.getAnnualOverview(tenantId, year);

  return <FinanceDashboard data={data} />;
}
