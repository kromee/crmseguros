import type { Prisma } from "@prisma/client";
import { NotFoundError } from "@/core/errors/app-error";
import { prisma } from "@/infrastructure/prisma/client";
import { eventRepository } from "../repositories/event.repository";
import type {
  CreateEventInput,
  EventsFilters,
  UpdateEventInput,
} from "../schemas/event.schema";

export const eventService = {
  async list(filters: EventsFilters) {
    return eventRepository.list(filters);
  },

  async getById(id: string) {
    const event = await eventRepository.findById(id);
    if (!event) throw new NotFoundError("Evento");
    return event;
  },

  async upcomingByUser(userId: string, limit = 5) {
    return eventRepository.upcomingByUser(userId, limit);
  },

  async listMonth(userId: string | null, year: number, month: number, contactId?: string | null) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    return eventRepository.list({
      userId: userId ?? undefined,
      contactId: contactId ?? undefined,
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
    });
  },

  async create(input: CreateEventInput, currentUserId: string | null) {
    const created = await eventRepository.create(input);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "calendar_events",
          entityId: created.id,
          action: "CREATE",
          changes: {
            title: created.title,
            type: created.type,
            startDate: created.startDate.toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    }
    return created;
  },

  async update(id: string, input: UpdateEventInput, currentUserId: string | null) {
    const existing = await eventRepository.findById(id);
    if (!existing) throw new NotFoundError("Evento");
    const updated = await eventRepository.update(id, input);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "calendar_events",
          entityId: id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue,
        },
      });
    }
    return updated;
  },

  async remove(id: string, currentUserId: string | null) {
    const existing = await eventRepository.findById(id);
    if (!existing) throw new NotFoundError("Evento");
    await eventRepository.delete(id);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "calendar_events",
          entityId: id,
          action: "DELETE",
          changes: { title: existing.title } as Prisma.InputJsonValue,
        },
      });
    }
  },

  async createRenewalReminder(params: {
    policyId: string;
    policyNumber: string;
    contactId: string;
    contactName: string;
    endDate: Date;
    userId: string;
  }) {
    const reminderDate = new Date(params.endDate);
    reminderDate.setDate(reminderDate.getDate() - 30);
    const endReminder = new Date(reminderDate);
    endReminder.setHours(endReminder.getHours() + 1);

    return eventRepository.create({
      title: `Renovación de póliza ${params.policyNumber}`,
      type: "RENOVACION",
      contactId: params.contactId,
      userId: params.userId,
      startDate: reminderDate,
      endDate: endReminder,
      description: `Renovación próxima de la póliza ${params.policyNumber} (${params.contactName}). Vence el ${params.endDate.toLocaleDateString("es-MX")}.`,
      priority: "ALTA",
      notifyClient: false,
      notifyAgent: true,
      reminderMinutes: 1440,
      status: "PENDING",
    });
  },
};
