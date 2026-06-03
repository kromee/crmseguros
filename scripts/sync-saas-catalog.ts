/**
 * Sincroniza el catálogo SaaS (src/core/tenant/saas-catalog.ts) → tabla `plans`.
 *
 * Uso en producción (después de migrar):
 *   npm run db:sync-catalog
 *
 * Idempotente: puede ejecutarse varias veces sin duplicar planes.
 */
import "dotenv/config";
import { planService } from "../src/modules/plans/services/plan.service";
import { SAAS_PLAN_CATALOG } from "../src/core/tenant/saas-catalog";

async function main() {
  console.log("📦 Sincronizando catálogo SaaS → MySQL (plans)...\n");

  const rows = await planService.syncCatalog();

  console.log("Planes en base de datos:\n");
  for (const row of rows.sort((a, b) => a.maxUsers - b.maxUsers)) {
    const catalog = SAAS_PLAN_CATALOG.find((p) => p.slug === row.slug);
    console.log(
      `  ✓ ${row.name} (${row.slug})`,
      `\n    id: ${row.id}`,
      `\n    usuarios: ${row.maxUsers}`,
      `\n    storage: ${row.storageLimitMb} MB`,
      `\n    mensual: $${Number(row.priceMonthly).toLocaleString("es-MX")} MXN`,
      catalog ? `\n    ${catalog.description}` : "",
      "\n"
    );
  }

  console.log(`✅ ${rows.length} planes sincronizados.`);
}

main()
  .catch((err) => {
    console.error("❌ Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/infrastructure/prisma/client");
    await prisma.$disconnect();
  });
