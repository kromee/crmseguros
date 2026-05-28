import { prisma } from "@/infrastructure/prisma/client";

export const reminderRepository = {
  async listPendingForUser(userId: string) {
    const now = new Date();
    const lookback = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const lookahead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    return prisma.calendarEvent.findMany({
      where: {
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
