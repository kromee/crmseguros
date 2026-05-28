import { prisma } from "@/infrastructure/prisma/client";

export const financeService = {
  async getAnnualOverview(year: number) {
    const monthlyPayments = await prisma.$queryRaw<
      Array<{ month: number; total: string; count: bigint }>
    >`
      SELECT
        MONTH(paymentDate) as month,
        CAST(SUM(amount) AS CHAR) as total,
        COUNT(*) as count
      FROM payments
      WHERE status = 'CONFIRMED'
        AND YEAR(paymentDate) = ${year}
      GROUP BY MONTH(paymentDate)
      ORDER BY month
    `;

    const premiumsByType = await prisma.$queryRaw<
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

    const totalPremiumRow = await prisma.$queryRaw<
      Array<{ total: string }>
    >`
      SELECT CAST(SUM(premium) AS CHAR) as total
      FROM policies
      WHERE status = 'ACTIVE'
        AND YEAR(startDate) <= ${year}
        AND YEAR(endDate) >= ${year}
    `;

    const totalPaymentsRow = await prisma.$queryRaw<
      Array<{ total: string }>
    >`
      SELECT CAST(SUM(amount) AS CHAR) as total
      FROM payments
      WHERE status = 'CONFIRMED'
        AND YEAR(paymentDate) = ${year}
    `;

    const upcomingPolicies = await prisma.policy.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        policyNumber: true,
        type: true,
        insurer: true,
        endDate: true,
        premium: true,
        paymentFrequency: true,
        contact: { select: { id: true, fullName: true } },
      },
      orderBy: { endDate: "asc" },
      take: 10,
    });

    const recentPayments = await prisma.payment.findMany({
      where: { status: "CONFIRMED" },
      orderBy: { paymentDate: "desc" },
      take: 10,
      include: {
        policy: {
          select: {
            policyNumber: true,
            type: true,
            contact: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    const activePoliciesCount = await prisma.policy.count({
      where: {
        status: "ACTIVE",
        startDate: { lte: new Date(`${year}-12-31`) },
        endDate: { gte: new Date(`${year}-01-01`) },
      },
    });

    return {
      year,
      totalPremiums: Number(totalPremiumRow[0]?.total ?? "0"),
      totalPayments: Number(totalPaymentsRow[0]?.total ?? "0"),
      activePoliciesCount,
      monthlyPayments: monthlyPayments.map((r) => ({
        month: Number(r.month),
        total: Number(r.total),
        count: Number(r.count),
      })),
      premiumsByType: premiumsByType.map((r) => ({
        type: r.type,
        totalPremium: Number(r.total_premium),
        count: Number(r.count),
      })),
      upcomingPolicies: upcomingPolicies.map((p) => ({
        id: p.id,
        policyNumber: p.policyNumber,
        type: p.type,
        insurer: p.insurer,
        endDate: p.endDate.toISOString(),
        premium: Number(p.premium.toString()),
        paymentFrequency: p.paymentFrequency,
        contactId: p.contact.id,
        contactName: p.contact.fullName,
      })),
      recentPayments: recentPayments.map((pm) => ({
        id: pm.id,
        amount: Number(pm.amount.toString()),
        paymentDate: pm.paymentDate.toISOString(),
        method: pm.method,
        policyNumber: pm.policy.policyNumber,
        policyType: pm.policy.type,
        contactId: pm.policy.contact.id,
        contactName: pm.policy.contact.fullName,
      })),
    };
  },
};
