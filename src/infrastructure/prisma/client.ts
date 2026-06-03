import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  /** Incrementar cuando cambie schema.prisma para invalidar cliente en dev */
  prismaSchemaRev?: string;
};

/** Bump al añadir/cambiar campos en schema (evita PrismaClient stale en hot reload) */
const PRISMA_SCHEMA_REV = "20260530120000-catalog-settings";

function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST ?? "localhost",
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER ?? "crm",
    password: process.env.DATABASE_PASSWORD ?? "crm_password",
    database: process.env.DATABASE_NAME ?? "crmseguros",
    connectionLimit: process.env.NODE_ENV === "development" ? 2 : 10,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  if (
    process.env.NODE_ENV !== "production" &&
    globalForPrisma.prisma &&
    globalForPrisma.prismaSchemaRev !== PRISMA_SCHEMA_REV
  ) {
    void globalForPrisma.prisma.$disconnect().catch(() => {});
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaSchemaRev = PRISMA_SCHEMA_REV;
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();
