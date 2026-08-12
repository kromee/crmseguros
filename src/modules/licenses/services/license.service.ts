import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { LicenseTerm } from "@prisma/client";
import { ValidationError } from "@/core/errors/app-error";
import { expiresAtFromTerm, LICENSE_TERM_LABELS } from "@/core/tenant/license-term";
import { uniqueTenantSlug } from "@/core/utils/slug";
import { prisma } from "@/infrastructure/prisma/client";
import { licenseRepository } from "../repositories/license.repository";
import type { ActivateTenantInput, GenerateLicenseInput } from "../schemas/license.schema";
import { normalizeLicenseKey } from "../schemas/license.schema";

function randomSegment(length = 4): string {
  return crypto.randomBytes(length).toString("hex").toUpperCase().slice(0, length);
}

export function formatLicenseCode(): string {
  return `VALE-${randomSegment()}-${randomSegment()}-${randomSegment()}`;
}

export const licenseService = {
  termLabel(term: LicenseTerm) {
    return LICENSE_TERM_LABELS[term];
  },

  async listRecent(limit = 50) {
    return licenseRepository.listRecent(limit);
  },

  async generate(input: GenerateLicenseInput) {
    const plan = await prisma.plan.findUnique({ where: { slug: input.planSlug } });
    if (!plan || !plan.isActive) {
      throw new ValidationError("Plan no válido o inactivo");
    }

    let code = formatLicenseCode();
    while (await licenseRepository.findByCode(code)) {
      code = formatLicenseCode();
    }

    const keyHash = await bcrypt.hash(code, 10);
    const expiresAt = input.keyValidDays
      ? new Date(Date.now() + input.keyValidDays * 24 * 60 * 60 * 1000)
      : null;

    const license = await licenseRepository.create({
      code,
      keyHash,
      planId: plan.id,
      term: input.term,
      expiresAt,
      notes: input.notes ?? null,
    });

    return { license, code, planName: plan.name, maxUsers: plan.maxUsers };
  },

  async validateKey(licenseKey: string) {
    const code = normalizeLicenseKey(licenseKey);
    const license = await licenseRepository.findByCode(code);
    if (!license) {
      throw new ValidationError("Clave de licencia no válida");
    }
    if (license.status !== "AVAILABLE") {
      throw new ValidationError("Esta licencia ya fue utilizada o no está disponible");
    }
    if (license.expiresAt && license.expiresAt < new Date()) {
      throw new ValidationError("La clave de licencia expiró antes de ser activada");
    }
    return license;
  },

  async activate(input: ActivateTenantInput) {
    const license = await this.validateKey(input.licenseKey);

    const emailTaken = await prisma.user.findUnique({ where: { email: input.email } });
    if (emailTaken) {
      throw new ValidationError("Ya existe una cuenta con ese correo");
    }

    const slug = await uniqueTenantSlug(input.companyName, async (s) => {
      const existing = await prisma.tenant.findUnique({ where: { slug: s } });
      return Boolean(existing);
    });

    const passwordHash = await bcrypt.hash(input.password, 10);
    const startsAt = new Date();
    const subscriptionExpiresAt = expiresAtFromTerm(startsAt, license.term);

    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.companyName.trim(),
          slug,
          status: "ACTIVE",
          planId: license.planId,
          maxUsers: license.plan.maxUsers,
          storageLimitMb: license.plan.storageLimitMb,
        },
      });

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: license.planId,
          term: license.term,
          status: "ACTIVE",
          startsAt,
          expiresAt: subscriptionExpiresAt,
        },
      });

      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: input.adminName.trim(),
          email: input.email,
          password: passwordHash,
          role: "TENANT_ADMIN",
          title: "Administrador",
        },
      });

      await licenseRepository.markUsed(license.id, tenant.id, tx);

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: admin.id,
          entity: "tenants",
          entityId: tenant.id,
          action: "CREATE",
          changes: {
            event: "tenant_activated",
            licenseTerm: license.term,
            planId: license.planId,
          },
        },
      });

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        slug: tenant.slug,
        adminEmail: admin.email,
        subscriptionExpiresAt,
        term: license.term,
      };
    });
  },
};
