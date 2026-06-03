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
  async list(tenantId: string, filters: EventsFilters) {
    return eventRepository.list(tenantId, filters);
  },

  async getById(tenantId: string, id: string) {
    const event = await eventRepository.findById(tenantId, id);
    if (!event) throw new NotFoundError("Evento");
    return event;
  },

  async upcomingByUser(tenantId: string, userId: string, limit = 5) {
    return eventRepository.upcomingByUser(tenantId, userId, limit);
  },

  async listMonth(
    tenantId: string,
    userId: string | null,
    year: number,
    month: number,
    contactId?: string | null
  ) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    return eventRepository.list(tenantId, {
      userId: userId ?? undefined,
      contactId: contactId ?? undefined,
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
    });
  },

  async create(
    tenantId: string,
    input: CreateEventInput,
    currentUserId: string | null
  ) {
    const created = await eventRepository.create(tenantId, input);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
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

  async update(
    tenantId: string,
    id: string,
    input: UpdateEventInput,
    currentUserId: string | null
  ) {
    const existing = await eventRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Evento");
    const updated = await eventRepository.update(tenantId, id, input);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
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

  async remove(tenantId: string, id: string, currentUserId: string | null) {
    const existing = await eventRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Evento");
    await eventRepository.delete(tenantId, id);
    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: currentUserId,
          entity: "calendar_events",
          entityId: id,
          action: "DELETE",
          changes: { title: existing.title } as Prisma.InputJsonValue,
        },
      });
    }
  },

  async createRenewalReminder(
    tenantId: string,
    params: {
      policyId: string;
      policyNumber: string;
      contactId: string;
      contactName: string;
      endDate: Date;
      userId: string;
    }
  ) {
    const reminderDate = new Date(params.endDate);
    reminderDate.setDate(reminderDate.getDate() - 30);
    const endReminder = new Date(reminderDate);
    endReminder.setHours(endReminder.getHours() + 1);

    return eventRepository.create(tenantId, {
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
