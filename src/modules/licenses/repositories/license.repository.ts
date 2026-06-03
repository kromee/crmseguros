import type { LicenseStatus, LicenseTerm, Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";

export const licenseRepository = {
  findByCode(code: string) {
    return prisma.license.findUnique({
      where: { code },
      include: { plan: true, tenant: { select: { id: true, name: true, slug: true } } },
    });
  },

  listRecent(limit = 50) {
    return prisma.license.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        plan: { select: { name: true, slug: true, maxUsers: true } },
        tenant: { select: { name: true, slug: true } },
      },
    });
  },

  create(data: {
    code: string;
    keyHash: string;
    planId: string;
    term: LicenseTerm;
    expiresAt: Date | null;
    notes?: string | null;
  }) {
    return prisma.license.create({ data });
  },

  markUsed(id: string, tenantId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.license.update({
      where: { id },
      data: {
        status: "USED" as LicenseStatus,
        tenantId,
        usedAt: new Date(),
      },
    });
  },
};
