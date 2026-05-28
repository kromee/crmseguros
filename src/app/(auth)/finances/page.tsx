import { auth } from "@/auth";
import { financeService } from "@/modules/payments/services/finance.service";
import { FinanceDashboard } from "@/modules/payments/components/finance-dashboard";

export const dynamic = "force-dynamic";

export default async function FinancesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const year = new Date().getFullYear();
  const data = await financeService.getAnnualOverview(year);

  return <FinanceDashboard data={data} />;
}
