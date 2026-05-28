import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import type {
  CreateEventInput,
  EventsFilters,
  UpdateEventInput,
} from "../schemas/event.schema";

export const eventRepository = {
  async findById(id: string) {
    return prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, code: true, fullName: true } },
        user: { select: { id: true, name: true, title: true } },
      },
    });
  },

  async list(filters: EventsFilters) {
    const where: Prisma.CalendarEventWhereInput = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.contactId) where.contactId = filters.contactId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.rangeStart || filters.rangeEnd) {
      where.startDate = {};
      if (filters.rangeStart) where.startDate.gte = new Date(filters.rangeStart);
      if (filters.rangeEnd) where.startDate.lte = new Date(filters.rangeEnd);
    }

    return prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: "asc" },
      include: {
        contact: { select: { id: true, code: true, fullName: true } },
        user: { select: { id: true, name: true } },
      },
    });
  },

  async countByMonth(userId: string, year: number, month: number) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    return prisma.calendarEvent.count({
      where: {
        userId,
        startDate: { gte: start, lt: end },
      },
    });
  },

  async upcomingByUser(userId: string, limit = 5) {
    return prisma.calendarEvent.findMany({
      where: {
        userId,
        status: "PENDING",
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: "asc" },
      take: limit,
      include: {
        contact: { select: { id: true, code: true, fullName: true } },
      },
    });
  },

  async create(input: CreateEventInput) {
    return prisma.calendarEvent.create({
      data: {
        title: input.title,
        type: input.type,
        contactId: input.contactId ?? null,
        userId: input.userId,
        startDate: input.startDate,
        endDate: input.endDate,
        description: input.description ?? null,
        priority: input.priority,
        notifyClient: input.notifyClient,
        notifyAgent: input.notifyAgent,
        reminderMinutes: input.reminderMinutes,
        status: input.status,
      },
    });
  },

  async update(id: string, input: UpdateEventInput) {
    return prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.contactId !== undefined && { contactId: input.contactId ?? null }),
        ...(input.userId !== undefined && { userId: input.userId }),
        ...(input.startDate !== undefined && { startDate: input.startDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
        ...(input.description !== undefined && { description: input.description ?? null }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.notifyClient !== undefined && { notifyClient: input.notifyClient }),
        ...(input.notifyAgent !== undefined && { notifyAgent: input.notifyAgent }),
        ...(input.reminderMinutes !== undefined && {
          reminderMinutes: input.reminderMinutes,
        }),
        ...(input.status !== undefined && { status: input.status }),
      },
    });
  },

  async delete(id: string) {
    return prisma.calendarEvent.delete({ where: { id } });
  },
};

export type EventListItem = Awaited<ReturnType<typeof eventRepository.list>>[number];
