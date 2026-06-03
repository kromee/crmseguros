import { reminderRepository } from "../repositories/reminder.repository";

export type ReminderStatus = "due" | "upcoming" | "overdue";

export type ReminderItem = {
  id: string;
  title: string;
  type: string;
  startDate: Date;
  endDate: Date;
  reminderAt: Date;
  reminderMinutes: number;
  status: ReminderStatus;
  contact: { id: string; code: string; fullName: string } | null;
};

const UPCOMING_WINDOW_MS = 60 * 60 * 1000;

function classifyReminder(
  now: Date,
  startDate: Date,
  reminderAt: Date
): ReminderStatus | null {
  if (now >= startDate) return "overdue";
  if (now >= reminderAt) return "due";
  if (reminderAt.getTime() - now.getTime() <= UPCOMING_WINDOW_MS) return "upcoming";
  return null;
}

export const reminderService = {
  async getQueue(tenantId: string, userId: string): Promise<ReminderItem[]> {
    const events = await reminderRepository.listPendingForUser(tenantId, userId);
    const now = new Date();

    const items: ReminderItem[] = [];

    for (const event of events) {
      const reminderAt = new Date(
        event.startDate.getTime() - event.reminderMinutes * 60 * 1000
      );
      const status = classifyReminder(now, event.startDate, reminderAt);
      if (!status) continue;

      items.push({
        id: event.id,
        title: event.title,
        type: event.type,
        startDate: event.startDate,
        endDate: event.endDate,
        reminderAt,
        reminderMinutes: event.reminderMinutes,
        status,
        contact: event.contact,
      });
    }

    const order: Record<ReminderStatus, number> = {
      overdue: 0,
      due: 1,
      upcoming: 2,
    };

    return items.sort((a, b) => {
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return a.startDate.getTime() - b.startDate.getTime();
    });
  },

  async countDue(tenantId: string, userId: string): Promise<number> {
    const queue = await this.getQueue(tenantId, userId);
    return queue.filter((r) => r.status === "due" || r.status === "overdue").length;
  },
};
