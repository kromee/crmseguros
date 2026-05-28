import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import type {
  CreatePolicyInput,
  PoliciesFilters,
  UpdatePolicyInput,
} from "../schemas/policy.schema";

export const policyRepository = {
  async findById(id: string) {
    return prisma.policy.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, code: true, fullName: true } },
      },
    });
  },

  async findByPolicyNumber(policyNumber: string) {
    return prisma.policy.findUnique({ where: { policyNumber } });
  },

  async listByContact(contactId: string) {
    return prisma.policy.findMany({
      where: { contactId },
      orderBy: [{ status: "asc" }, { endDate: "desc" }],
      include: {
        renewedBy: {
          select: { id: true, policyNumber: true, status: true },
        },
      },
    });
  },

  async list(filters: PoliciesFilters) {
    const where: Prisma.PolicyWhereInput = {};

    if (filters.contactId) where.contactId = filters.contactId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { policyNumber: { contains: q } },
        { plan: { contains: q } },
        { insurer: { contains: q } },
        { contact: { fullName: { contains: q } } },
        { contact: { code: { contains: q } } },
      ];
    }

    if (filters.expiringInDays !== undefined) {
      const now = new Date();
      const horizon = new Date();
      horizon.setDate(horizon.getDate() + filters.expiringInDays);
      where.endDate = { gte: now, lte: horizon };
      where.status = "ACTIVE";
    }

    const skip = (filters.page - 1) * filters.pageSize;

    const [items, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        orderBy: { endDate: "asc" },
        skip,
        take: filters.pageSize,
        include: {
          contact: { select: { id: true, code: true, fullName: true } },
          renewedBy: {
            select: { id: true, policyNumber: true, status: true },
          },
        },
      }),
      prisma.policy.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    };
  },

  async create(input: CreatePolicyInput) {
    return prisma.policy.create({
      data: {
        contactId: input.contactId,
        policyNumber: input.policyNumber,
        type: input.type,
        plan: input.plan ?? null,
        insurer: input.insurer ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        paymentFrequency: input.paymentFrequency,
        premium: input.premium,
        sumInsured: input.sumInsured ?? null,
        beneficiaries: input.beneficiaries ?? null,
        status: input.status,
        notes: input.notes ?? null,
        insuredAsset: input.insuredAsset ?? null,
        coverageType: input.coverageType ?? null,
        vehiclePhoto: input.vehiclePhoto ?? null,
        currency: input.currency ?? null,
        term: input.term ?? null,
      },
    });
  },

  async update(id: string, input: UpdatePolicyInput) {
    return prisma.policy.update({
      where: { id },
      data: {
        ...(input.policyNumber !== undefined && { policyNumber: input.policyNumber }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.plan !== undefined && { plan: input.plan ?? null }),
        ...(input.insurer !== undefined && { insurer: input.insurer ?? null }),
        ...(input.startDate !== undefined && input.startDate !== null && {
          startDate: input.startDate,
        }),
        ...(input.endDate !== undefined && input.endDate !== null && {
          endDate: input.endDate,
        }),
        ...(input.paymentFrequency !== undefined && {
          paymentFrequency: input.paymentFrequency,
        }),
        ...(input.premium !== undefined && input.premium !== null && {
          premium: input.premium,
        }),
        ...(input.sumInsured !== undefined && { sumInsured: input.sumInsured ?? null }),
        ...(input.beneficiaries !== undefined && {
          beneficiaries: input.beneficiaries ?? null,
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes ?? null }),
        ...(input.insuredAsset !== undefined && { insuredAsset: input.insuredAsset ?? null }),
        ...(input.coverageType !== undefined && { coverageType: input.coverageType ?? null }),
        ...(input.vehiclePhoto !== undefined && { vehiclePhoto: input.vehiclePhoto ?? null }),
        ...(input.currency !== undefined && { currency: input.currency ?? null }),
        ...(input.term !== undefined && { term: input.term ?? null }),
      },
    });
  },

  async delete(id: string) {
    return prisma.policy.delete({ where: { id } });
  },

  async countByStatus() {
    const rows = await prisma.policy.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    return rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count._all;
      return acc;
    }, {});
  },
};

export type PolicyListItem = Awaited<ReturnType<typeof policyRepository.list>>["items"][number];
