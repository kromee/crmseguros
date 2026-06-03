import { prisma } from "@/infrastructure/prisma/client";

export const reminderRepository = {
  async listPendingForUser(tenantId: string, userId: string) {
    const now = new Date();
    const lookback = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const lookahead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    return prisma.calendarEvent.findMany({
      where: {
        tenantId,
        userId,
        status: "PENDING",
        notifyAgent: true,
        startDate: { gte: lookback, lte: lookahead },
      },
      orderBy: { startDate: "asc" },
      include: {
        contact: { select: { id: true, code: true, fullName: true } },
      },
    });
  },
};
