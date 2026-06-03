/**
 * SAAS 0 — Migra una BD existente (single-tenant) a multi-tenant.
 * Crea plan/tenant por defecto, asigna tenantId y convierte ADMIN → TENANT_ADMIN.
 *
 * Uso: npm run db:migrate-saas
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import {
  SAAS_PLAN_CATALOG,
  SAAS_PRODUCT_CONFIG,
  toPlanUpsertData,
} from "../src/core/tenant/saas-catalog";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER ?? "crm",
  password: process.env.DATABASE_PASSWORD ?? "crm_password",
  database: process.env.DATABASE_NAME ?? "crmseguros",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

const DEFAULT_PLAN_SLUG = SAAS_PRODUCT_CONFIG.defaultPlanSlug;
const DEFAULT_TENANT_SLUG = SAAS_PRODUCT_CONFIG.defaultTenantSlug;

async function main() {
  console.log("🔄 SAAS 0 — migración multi-tenant...");

  for (const catalogPlan of SAAS_PLAN_CATALOG) {
    const data = toPlanUpsertData(catalogPlan);
    await prisma.plan.upsert({
      where: { slug: catalogPlan.slug },
      create: data,
      update: {
        name: data.name,
        maxUsers: data.maxUsers,
        storageLimitMb: data.storageLimitMb,
        priceMonthly: data.priceMonthly,
        isActive: data.isActive,
      },
    });
  }

  const plan = await prisma.plan.findUniqueOrThrow({ where: { slug: DEFAULT_PLAN_SLUG } });

  let tenant = await prisma.tenant.findUnique({ where: { slug: DEFAULT_TENANT_SLUG } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "Seguros Mexa",
        slug: DEFAULT_TENANT_SLUG,
        status: "ACTIVE",
        planId: plan.id,
        maxUsers: 2,
        storageLimitMb: 5120,
      },
    });

    const startsAt = new Date();
    const expiresAt = new Date(startsAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        term: "ANNUAL",
        status: "ACTIVE",
        startsAt,
        expiresAt,
      },
    });
  }

  const tenantId = tenant.id;
  console.log(`   Tenant: ${tenant.name} (${tenantId})`);

  await prisma.$executeRawUnsafe(`UPDATE users SET role = 'TENANT_ADMIN' WHERE role = 'ADMIN'`);

  await prisma.$executeRawUnsafe(`UPDATE users SET tenantId = ? WHERE tenantId IS NULL AND role != 'SUPER_ADMIN'`, tenantId);

  const tables = [
    "contacts",
    "policies",
    "pension_services",
    "vehicle_services",
    "payments",
    "prospects",
    "activities",
    "calendar_events",
  ] as const;

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`UPDATE \`${table}\` SET tenantId = ? WHERE tenantId IS NULL`, tenantId);
  }

  await prisma.$executeRawUnsafe(
    `UPDATE audit_log SET tenantId = ? WHERE tenantId IS NULL AND userId IN (SELECT id FROM users WHERE tenantId = ?)`,
    tenantId,
    tenantId
  );

  const superExists = await prisma.user.findUnique({ where: { email: "superadmin@crm.local" } });
  if (!superExists) {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("Admin123!", 10);
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "superadmin@crm.local",
        password: passwordHash,
        role: "SUPER_ADMIN",
        title: "Plataforma SaaS",
        tenantId: null,
      },
    });
    console.log("   Super admin creado: superadmin@crm.local / Admin123!");
  }

  console.log("✅ Migración SAAS 0 completada");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
