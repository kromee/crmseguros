/**
 * Catálogo SaaS — fuente de verdad para planes comerciales.
 *
 * Este archivo define los datos que se sincronizan a la tabla `plans` en MySQL.
 * En producción, después de migrar, ejecutar:
 *
 *   npm run db:sync-catalog
 *
 * Los `id` son UUID fijos para que seed, migraciones y upserts sean idempotentes.
 */

export type SaasPlanDefinition = {
  /** UUID estable (no cambiar en producción una vez desplegado) */
  id: string;
  slug: string;
  name: string;
  /** Texto comercial para UI / documentación (no se guarda en BD) */
  description: string;
  maxUsers: number;
  /** Límite de almacenamiento en megabytes */
  storageLimitMb: number;
  /** Precio de referencia mensual en MXN */
  priceMonthly: number;
  isActive: boolean;
  sortOrder: number;
};

/** Planes comerciales: 2, 5 y 10 usuarios */
export const SAAS_PLAN_CATALOG: SaasPlanDefinition[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "plan-agencia",
    name: "Plan Agencia",
    description: "Agencia pequeña o dupla comercial. Ideal para 2 usuarios.",
    maxUsers: 2,
    storageLimitMb: 5120,
    priceMonthly: 2500,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "plan-equipo",
    name: "Plan Equipo",
    description: "Equipo en crecimiento con hasta 5 usuarios activos.",
    maxUsers: 5,
    storageLimitMb: 12800,
    priceMonthly: 4500,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "plan-empresa",
    name: "Plan Empresa",
    description: "Operación consolidada con hasta 10 usuarios activos.",
    maxUsers: 10,
    storageLimitMb: 25600,
    priceMonthly: 7500,
    isActive: true,
    sortOrder: 3,
  },
];

/** Slugs válidos derivados del catálogo */
export const SAAS_PLAN_SLUGS = SAAS_PLAN_CATALOG.map((p) => p.slug) as [
  string,
  ...string[],
];

export type SaasPlanSlug = (typeof SAAS_PLAN_CATALOG)[number]["slug"];

/** Configuración general del producto SaaS */
export const SAAS_PRODUCT_CONFIG = {
  /** Plan asignado al tenant demo / piloto */
  defaultPlanSlug: "plan-agencia" as SaasPlanSlug,
  /** Tenant demo en desarrollo */
  defaultTenantSlug: "seguros-mexa",
  /** Días por defecto para usar una clave antes de activar */
  licenseKeyValidDaysDefault: 30,
  /** Formato de claves de licencia */
  licenseCodePrefix: "MEXA",
  /** Vigencias disponibles al generar licencia / renovar */
  licenseTerms: ["MONTHLY", "ANNUAL", "MONTHS_24", "YEARS_4"] as const,
  /** Almacenamiento base por usuario (referencia comercial; 2 usuarios → 5 GB) */
  storageMbPerUserReference: 2560,
} as const;

/** Datos mínimos para upsert en Prisma (tabla `plans`) */
export function toPlanUpsertData(plan: SaasPlanDefinition) {
  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    maxUsers: plan.maxUsers,
    storageLimitMb: plan.storageLimitMb,
    priceMonthly: plan.priceMonthly,
    isActive: plan.isActive,
  };
}

export function getPlanBySlug(slug: string): SaasPlanDefinition | undefined {
  return SAAS_PLAN_CATALOG.find((p) => p.slug === slug);
}

export function formatPlanStorage(mb: number): string {
  if (mb >= 1024 && mb % 1024 === 0) return `${mb / 1024} GB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toLocaleString("es-MX")} MB`;
}

export function formatPlanLabel(plan: {
  name: string;
  maxUsers: number;
  storageLimitMb: number;
  priceMonthly: number | { toString(): string };
}): string {
  const price = Number(plan.priceMonthly.toString());
  return `${plan.name} — ${plan.maxUsers} usuarios · ${formatPlanStorage(plan.storageLimitMb)} · $${price.toLocaleString("es-MX")}/mes`;
}

/** @deprecated Usar SAAS_PLAN_CATALOG */
export const SAAS_PLANS = SAAS_PLAN_CATALOG.map(
  ({ slug, name, maxUsers, storageLimitMb, priceMonthly }) => ({
    slug,
    name,
    maxUsers,
    storageLimitMb,
    priceMonthly,
  })
);
