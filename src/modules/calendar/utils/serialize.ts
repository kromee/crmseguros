interface RawEvent {
  id: string;
  title: string;
  type: string;
  contactId: string | null;
  userId: string;
  startDate: Date;
  endDate: Date;
  description: string | null;
  priority: string;
  notifyClient: boolean;
  notifyAgent: boolean;
  reminderMinutes: number;
  status: string;
  contact: { id: string; code: string; fullName: string } | null;
  user?: { id: string; name: string } | null;
}

export function serializeEvent(e: RawEvent) {
  return {
    id: e.id,
    title: e.title,
    type: e.type,
    contactId: e.contactId,
    userId: e.userId,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    description: e.description,
    priority: e.priority,
    notifyClient: e.notifyClient,
    notifyAgent: e.notifyAgent,
    reminderMinutes: e.reminderMinutes,
    status: e.status,
    contact: e.contact,
    user: e.user ?? null,
  };
}

export type EventDTO = ReturnType<typeof serializeEvent>;
