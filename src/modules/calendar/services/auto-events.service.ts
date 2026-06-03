import { prisma } from "@/infrastructure/prisma/client";

export interface AutoEvent {
  id: string;
  title: string;
  type: "VENCIMIENTO" | "COBRO_PROGRAMADO";
  startDate: string;
  endDate: string;
  contactId: string;
  contactName: string;
  policyId: string;
  policyNumber: string;
  policyType: string;
  insurer: string | null;
  premium: number;
  daysUntil: number;
  urgency: "normal" | "warning" | "critical" | "expired";
  status: "AUTO";
}

function getUrgency(daysUntil: number): AutoEvent["urgency"] {
  if (daysUntil < 0) return "expired";
  if (daysUntil <= 7) return "critical";
  if (daysUntil <= 30) return "warning";
  return "normal";
}

function getPaymentDates(
  startDate: Date,
  endDate: Date,
  frequency: string
): Date[] {
  const dates: Date[] = [];
  const intervalMonths: Record<string, number> = {
    MENSUAL: 1,
    TRIMESTRAL: 3,
    SEMESTRAL: 6,
    ANUAL: 12,
  };
  const months = intervalMonths[frequency];
  if (!months) return dates;

  const current = new Date(startDate);
  current.setMonth(current.getMonth() + months);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setMonth(current.getMonth() + months);
  }

  return dates;
}

export const autoEventsService = {
  async getForMonth(tenantId: string, year: number, month: number): Promise<AutoEvent[]> {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    const now = new Date();

    const expandedStart = new Date(year, month - 1, 1);
    const expandedEnd = new Date(year, month + 2, 0);

    const policies = await prisma.policy.findMany({
      where: {
        tenantId,
        status: { in: ["ACTIVE", "RENEWAL"] },
        endDate: { gte: expandedStart, lte: expandedEnd },
      },
      select: {
        id: true,
        policyNumber: true,
        type: true,
        insurer: true,
        startDate: true,
        endDate: true,
        premium: true,
        paymentFrequency: true,
        contact: { select: { id: true, fullName: true } },
      },
    });

    const activePolicies = await prisma.policy.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
      select: {
        id: true,
        policyNumber: true,
        type: true,
        insurer: true,
        startDate: true,
        endDate: true,
        premium: true,
        paymentFrequency: true,
        contact: { select: { id: true, fullName: true } },
      },
    });

    const events: AutoEvent[] = [];

    for (const p of policies) {
      const endDate = new Date(p.endDate);
      if (endDate >= monthStart && endDate <= monthEnd) {
        const daysUntil = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        events.push({
          id: `venc-${p.id}`,
          title: `Vencimiento: ${p.policyNumber}`,
          type: "VENCIMIENTO",
          startDate: endDate.toISOString(),
          endDate: endDate.toISOString(),
          contactId: p.contact.id,
          contactName: p.contact.fullName,
          policyId: p.id,
          policyNumber: p.policyNumber,
          policyType: p.type,
          insurer: p.insurer,
          premium: Number(p.premium.toString()),
          daysUntil,
          urgency: getUrgency(daysUntil),
          status: "AUTO",
        });
      }
    }

    for (const p of activePolicies) {
      if (p.paymentFrequency === "ANUAL") continue;

      const paymentDates = getPaymentDates(
        new Date(p.startDate),
        new Date(p.endDate),
        p.paymentFrequency
      );

      for (const payDate of paymentDates) {
        if (payDate >= monthStart && payDate <= monthEnd) {
          const daysUntil = Math.ceil(
            (payDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          events.push({
            id: `cobro-${p.id}-${payDate.toISOString().slice(0, 10)}`,
            title: `Cobro: ${p.policyNumber}`,
            type: "COBRO_PROGRAMADO",
            startDate: payDate.toISOString(),
            endDate: payDate.toISOString(),
            contactId: p.contact.id,
            contactName: p.contact.fullName,
            policyId: p.id,
            policyNumber: p.policyNumber,
            policyType: p.type,
            insurer: p.insurer,
            premium: Number(p.premium.toString()),
            daysUntil,
            urgency: getUrgency(daysUntil),
            status: "AUTO",
          });
        }
      }
    }

    return events;
  },
};
