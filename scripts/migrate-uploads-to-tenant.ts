#!/usr/bin/env tsx
/**
 * Migra archivos legacy en uploads/ hacia uploads/{tenantId}/{categoria}/...
 *
 * Uso:
 *   npm run uploads:migrate          # dry-run (solo muestra cambios)
 *   npm run uploads:migrate -- --apply
 */
import "dotenv/config";
import { copyFile, mkdir, rename, stat, unlink } from "fs/promises";
import path from "path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { isTenantScopedPath } from "../src/infrastructure/storage/tenant-paths";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const apply = process.argv.includes("--apply");

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER ?? "crm",
  password: process.env.DATABASE_PASSWORD ?? "crm_password",
  database: process.env.DATABASE_NAME ?? "crmseguros",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

type FileRef = { table: string; id: string; field: string; path: string; tenantId: string };

function categoryFromLegacyPath(relativePath: string): string {
  if (relativePath.startsWith("policies/vehicles/")) return "policies/vehicles";
  if (relativePath.startsWith("policies/")) return "policies";
  if (relativePath.startsWith("vehicles/documents/")) return "vehicles/documents";
  if (relativePath.startsWith("contacts/")) return "contacts";
  if (relativePath.startsWith("users/")) return "users";
  if (relativePath.startsWith("activities/")) return "activities";
  if (relativePath.startsWith("branding/")) return "branding";
  return "general";
}

async function collectFileRefs(): Promise<FileRef[]> {
  const refs: FileRef[] = [];

  const contacts = await prisma.contact.findMany({
    where: { photo: { not: null } },
    select: { id: true, tenantId: true, photo: true },
  });
  for (const c of contacts) {
    if (c.photo) refs.push({ table: "contacts", id: c.id, field: "photo", path: c.photo, tenantId: c.tenantId });
  }

  const users = await prisma.user.findMany({
    where: { avatar: { not: null } },
    select: { id: true, tenantId: true, avatar: true },
  });
  for (const u of users) {
    if (u.avatar && u.tenantId) {
      refs.push({ table: "users", id: u.id, field: "avatar", path: u.avatar, tenantId: u.tenantId });
    }
  }

  const tenants = await prisma.tenant.findMany({
    where: { logo: { not: null } },
    select: { id: true, logo: true },
  });
  for (const t of tenants) {
    if (t.logo) refs.push({ table: "tenants", id: t.id, field: "logo", path: t.logo, tenantId: t.id });
  }

  const policies = await prisma.policy.findMany({
    select: {
      id: true,
      tenantId: true,
      policyFile: true,
      vehiclePhoto: true,
    },
  });
  for (const p of policies) {
    if (p.policyFile) {
      refs.push({ table: "policies", id: p.id, field: "policyFile", path: p.policyFile, tenantId: p.tenantId });
    }
    if (p.vehiclePhoto) {
      refs.push({
        table: "policies",
        id: p.id,
        field: "vehiclePhoto",
        path: p.vehiclePhoto,
        tenantId: p.tenantId,
      });
    }
  }

  const activities = await prisma.activity.findMany({
    select: { id: true, tenantId: true, attachments: true },
  });
  for (const a of activities) {
    if (!a.attachments) continue;
    const paths = Array.isArray(a.attachments)
      ? (a.attachments as string[])
      : typeof a.attachments === "object" && a.attachments
        ? Object.values(a.attachments as Record<string, string>)
        : [];
    for (const attachmentPath of paths) {
      if (typeof attachmentPath === "string" && attachmentPath) {
        refs.push({
          table: "activities",
          id: a.id,
          field: "attachments",
          path: attachmentPath,
          tenantId: a.tenantId,
        });
      }
    }
  }

  const vehicles = await prisma.vehicleService.findMany({
    select: { id: true, tenantId: true, documents: true },
  });
  for (const v of vehicles) {
    if (!v.documents || typeof v.documents !== "object") continue;
    for (const [field, docPath] of Object.entries(v.documents as Record<string, unknown>)) {
      if (typeof docPath === "string" && docPath.includes("/")) {
        refs.push({
          table: "vehicle_services",
          id: v.id,
          field,
          path: docPath,
          tenantId: v.tenantId,
        });
      }
    }
  }

  return refs;
}

async function fileExists(fullPath: string) {
  try {
    await stat(fullPath);
    return true;
  } catch {
    return false;
  }
}

async function migrateOne(ref: FileRef) {
  if (isTenantScopedPath(ref.path, ref.tenantId)) {
    return { status: "skipped_scoped" as const };
  }

  const category = categoryFromLegacyPath(ref.path);
  const filename = path.basename(ref.path);
  const newRelative = `${ref.tenantId}/${category}/${filename}`;
  const oldFull = path.join(UPLOAD_DIR, ref.path);
  const newFull = path.join(UPLOAD_DIR, newRelative);

  if (!(await fileExists(oldFull))) {
    return { status: "missing_file" as const, newRelative };
  }

  if (apply) {
    await mkdir(path.dirname(newFull), { recursive: true });
    if (await fileExists(newFull)) {
      await copyFile(oldFull, newFull);
    } else {
      await rename(oldFull, newFull);
    }

    if (ref.table === "contacts") {
      await prisma.contact.update({ where: { id: ref.id }, data: { photo: newRelative } });
    } else if (ref.table === "users") {
      await prisma.user.update({ where: { id: ref.id }, data: { avatar: newRelative } });
    } else if (ref.table === "tenants") {
      await prisma.tenant.update({ where: { id: ref.id }, data: { logo: newRelative } });
    } else if (ref.table === "policies") {
      await prisma.policy.update({
        where: { id: ref.id },
        data: { [ref.field]: newRelative },
      });
    } else if (ref.table === "activities") {
      const activity = await prisma.activity.findUnique({ where: { id: ref.id } });
      if (activity?.attachments) {
        const next = Array.isArray(activity.attachments)
          ? (activity.attachments as string[]).map((p) => (p === ref.path ? newRelative : p))
          : Object.fromEntries(
              Object.entries(activity.attachments as Record<string, string>).map(([k, p]) => [
                k,
                p === ref.path ? newRelative : p,
              ])
            );
        await prisma.activity.update({ where: { id: ref.id }, data: { attachments: next } });
      }
    } else if (ref.table === "vehicle_services") {
      const vehicle = await prisma.vehicleService.findUnique({ where: { id: ref.id } });
      if (vehicle?.documents && typeof vehicle.documents === "object") {
        const next = {
          ...(vehicle.documents as Record<string, string>),
          [ref.field]: newRelative,
        };
        await prisma.vehicleService.update({
          where: { id: ref.id },
          data: { documents: next },
        });
      }
    }
  }

  return { status: "migrated" as const, from: ref.path, to: newRelative };
}

async function main() {
  console.log(apply ? "=== APLICANDO migración ===" : "=== DRY RUN (usa --apply para ejecutar) ===");

  const refs = await collectFileRefs();
  const legacy = refs.filter((r) => !isTenantScopedPath(r.path, r.tenantId));

  console.log(`Referencias en BD: ${refs.length}, legacy sin tenant: ${legacy.length}`);

  const summary = { migrated: 0, skipped_scoped: 0, missing_file: 0 };

  for (const ref of legacy) {
    const result = await migrateOne(ref);
    if (result.status === "migrated") {
      summary.migrated++;
      console.log(`  ${result.from} → ${result.to}`);
    } else if (result.status === "missing_file") {
      summary.missing_file++;
      console.warn(`  MISSING: ${ref.path} (${ref.table}.${ref.field})`);
    } else {
      summary.skipped_scoped++;
    }
  }

  console.log("\nResumen:", summary);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
