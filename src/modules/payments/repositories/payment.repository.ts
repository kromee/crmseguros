import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import type {
  CreatePaymentInput,
  PaymentFilters,
} from "../schemas/payment.schema";

export const paymentRepository = {
  async findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            type: true,
            insurer: true,
            contact: { select: { id: true, fullName: true, code: true } },
          },
        },
      },
    });
  },

  async listByPolicy(policyId: string) {
    return prisma.payment.findMany({
      where: { policyId },
      orderBy: { paymentDate: "desc" },
    });
  },

  async list(filters: PaymentFilters) {
    const where: Prisma.PaymentWhereInput = {};

    if (filters.policyId) where.policyId = filters.policyId;
    if (filters.status) where.status = filters.status;

    if (filters.contactId) {
      where.policy = { contactId: filters.contactId };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.paymentDate = {};
      if (filters.dateFrom) where.paymentDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.paymentDate.lte = new Date(filters.dateTo);
    }

    const skip = (filters.page - 1) * filters.pageSize;

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { paymentDate: "desc" },
        skip,
        take: filters.pageSize,
        include: {
          policy: {
            select: {
              id: true,
              policyNumber: true,
              type: true,
              insurer: true,
              premium: true,
              paymentFrequency: true,
              contact: { select: { id: true, fullName: true, code: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    };
  },

  async create(input: CreatePaymentInput) {
    return prisma.payment.create({
      data: {
        policyId: input.policyId,
        amount: input.amount,
        paymentDate: input.paymentDate,
        periodStart: input.periodStart ?? null,
        periodEnd: input.periodEnd ?? null,
        method: input.method,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        status: input.status,
      },
    });
  },

  async delete(id: string) {
    return prisma.payment.delete({ where: { id } });
  },

  async sumByPolicy(policyId: string) {
    const result = await prisma.payment.aggregate({
      where: { policyId, status: "CONFIRMED" },
      _sum: { amount: true },
      _count: { _all: true },
    });
    return {
      total: Number(result._sum.amount?.toString() ?? "0"),
      count: result._count._all,
    };
  },

  async annualSummary(year: number) {
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year}-12-31`);

    const rows = await prisma.$queryRaw<
      Array<{ month: number; total: string; count: bigint }>
    >`
      SELECT
        MONTH(paymentDate) as month,
        CAST(SUM(amount) AS CHAR) as total,
        COUNT(*) as count
      FROM payments
      WHERE status = 'CONFIRMED'
        AND paymentDate >= ${start}
        AND paymentDate <= ${end}
      GROUP BY MONTH(paymentDate)
      ORDER BY month
    `;

    return rows.map((r) => ({
      month: Number(r.month),
      total: Number(r.total),
      count: Number(r.count),
    }));
  },

  async totalPremiumsAnnual(year: number) {
    const result = await prisma.$queryRaw<
      Array<{ type: string; total_premium: string; count: bigint }>
    >`
      SELECT
        type,
        CAST(SUM(premium) AS CHAR) as total_premium,
        COUNT(*) as count
      FROM policies
      WHERE status = 'ACTIVE'
        AND YEAR(startDate) <= ${year}
        AND YEAR(endDate) >= ${year}
      GROUP BY type
    `;

    return result.map((r) => ({
      type: r.type,
      totalPremium: Number(r.total_premium),
      count: Number(r.count),
    }));
  },
};

export type PaymentListItem = Awaited<
  ReturnType<typeof paymentRepository.list>
>["items"][number];
