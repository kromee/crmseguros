import type { Prisma } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/core/errors/app-error";
import { prisma } from "@/infrastructure/prisma/client";
import { contactRepository } from "@/modules/contacts/repositories/contact.repository";
import { prospectRepository } from "../repositories/prospect.repository";
import type {
  CreateProspectInput,
  CreateProspectWithContactInput,
  ProspectsFilters,
  UpdateProspectInput,
} from "../schemas/prospect.schema";

async function generateProspectCode(tenantId: string): Promise<string> {
  const next = await prospectRepository.nextCodeNumber(tenantId);
  return `PR-${next}`;
}

async function generateContactCode(tenantId: string): Promise<string> {
  const next = await contactRepository.nextCodeNumber(tenantId);
  return `SM-${next}`;
}

const NEXT_ACTION_TO_EVENT_TYPE: Record<string, "LLAMADA" | "TAREA"> = {
  LLAMADA: "LLAMADA",
  CITA: "TAREA",
  EMAIL: "TAREA",
  OTRO: "TAREA",
};

export const prospectService = {
  async list(tenantId: string, filters: ProspectsFilters) {
    return prospectRepository.list(tenantId, filters);
  },

  async listByStage(tenantId: string, filters: ProspectsFilters) {
    return prospectRepository.listByStage(tenantId, filters);
  },

  async getById(tenantId: string, id: string) {
    const prospect = await prospectRepository.findById(tenantId, id);
    if (!prospect) throw new NotFoundError("Prospecto");
    return prospect;
  },

  async getOverview(tenantId: string) {
    return prospectRepository.countByStage(tenantId);
  },

  async createWithContact(
    tenantId: string,
    input: CreateProspectWithContactInput,
    currentUserId: string | null
  ) {
    if (input.email) {
      const exists = await prisma.contact.findFirst({
        where: { tenantId, email: input.email },
        select: { id: true, fullName: true },
      });
      if (exists) {
        throw new ValidationError(
          `Ya existe un contacto con ese correo (${exists.fullName})`
        );
      }
    }

    const [contactCode, prospectCode] = await Promise.all([
      generateContactCode(tenantId),
      generateProspectCode(tenantId),
    ]);

    const assignedUser = input.assignedTo ?? currentUserId ?? null;
    const hasScheduledAction = !!(input.nextActionType && input.nextActionDate);

    const result = await prisma.$transaction(async (tx) => {
      const contact = await tx.contact.create({
        data: {
          tenantId,
          code: contactCode,
          fullName: input.fullName,
          phone: input.phone,
          email: input.email ?? null,
          photo: input.photo ?? null,
          origin: input.origin,
          type: "PROSPECT",
          status: "PENDING",
          assignedTo: assignedUser ?? undefined,
        },
      });

      const prospect = await tx.prospect.create({
        data: {
          tenantId,
          code: prospectCode,
          contactId: contact.id,
          stage: "CONTACTO_INICIAL",
          priority: input.priority,
          serviceOfInterest: input.serviceOfInterest ?? null,
          estimatedValue: input.estimatedValue ?? null,
          probability: 50,
          assignedTo: assignedUser,
          notes: input.notes ?? null,
          nextActionType: input.nextActionType ?? null,
          nextActionDate: input.nextActionDate ?? null,
          rating: input.rating,
          status: "ACTIVE",
        },
      });

      if (currentUserId) {
        await tx.auditLog.createMany({
          data: [
            {
              tenantId,
              userId: currentUserId,
              entity: "contacts",
              entityId: contact.id,
              action: "CREATE",
              changes: {
                code: contactCode,
                fullName: contact.fullName,
                type: contact.type,
                from: "prospect_form",
              } as Prisma.InputJsonValue,
            },
            {
              tenantId,
              userId: currentUserId,
              entity: "prospects",
              entityId: prospect.id,
              action: "CREATE",
              changes: {
                code: prospectCode,
                contactId: contact.id,
                stage: prospect.stage,
                serviceOfInterest: prospect.serviceOfInterest,
              } as Prisma.InputJsonValue,
            },
          ],
        });

        await tx.activity.create({
          data: {
            tenantId,
            contactId: contact.id,
            prospectId: prospect.id,
            type: "NOTA",
            summary: `Prospecto creado (${prospectCode}). Servicio de interés: ${
              prospect.serviceOfInterest ?? "no especificado"
            }`,
            result: "EXITOSO",
            performedBy: currentUserId,
            isAutomatic: true,
          },
        });
      }

      if (hasScheduledAction && assignedUser) {
        const start = input.nextActionDate!;
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        const eventType =
          NEXT_ACTION_TO_EVENT_TYPE[input.nextActionType!] ?? "TAREA";

        await tx.calendarEvent.create({
          data: {
            tenantId,
            title: `${input.nextActionType} a ${contact.fullName} (${prospectCode})`,
            type: eventType,
            contactId: contact.id,
            userId: assignedUser,
            startDate: start,
            endDate: end,
            description:
              input.notes ??
              `Próxima acción para el prospecto ${prospectCode}. Servicio: ${
                prospect.serviceOfInterest ?? "no especificado"
              }`,
            priority: input.priority,
            notifyClient: false,
            notifyAgent: true,
            reminderMinutes: input.reminderMinutes ?? 15,
            status: "PENDING",
          },
        });
      }

      return { contact, prospect };
    });

    return result;
  },

  async create(
    tenantId: string,
    input: CreateProspectInput,
    currentUserId: string | null
  ) {
    const contact = await prisma.contact.findFirst({
      where: { id: input.contactId, tenantId },
      select: { id: true, type: true },
    });
    if (!contact) {
      throw new ValidationError("El contacto seleccionado no existe");
    }

    const code = await generateProspectCode(tenantId);
    const data: CreateProspectInput = {
      ...input,
      assignedTo: input.assignedTo ?? currentUserId,
    };

    const created = await prospectRepository.create(tenantId, data, code);

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: currentUserId,
          entity: "prospects",
          entityId: created.id,
          action: "CREATE",
          changes: {
            code,
            contactId: created.contactId,
            stage: created.stage,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return created;
  },

  async update(
    tenantId: string,
    id: string,
    input: UpdateProspectInput,
    currentUserId: string | null
  ) {
    const existing = await prospectRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Prospecto");

    const updated = await prospectRepository.update(tenantId, id, input);

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: currentUserId,
          entity: "prospects",
          entityId: id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue,
        },
      });
    }

    return updated;
  },

  async changeStage(
    tenantId: string,
    id: string,
    stage: string,
    currentUserId: string | null
  ) {
    const existing = await prospectRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Prospecto");

    const updated = await prospectRepository.updateStage(tenantId, id, stage);

    await prisma.calendarEvent.updateMany({
      where: {
        tenantId,
        contactId: existing.contactId,
        status: "PENDING",
      },
      data: { status: "COMPLETED" },
    });

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: currentUserId,
          entity: "prospects",
          entityId: id,
          action: "UPDATE",
          changes: {
            stage_from: existing.stage,
            stage_to: stage,
          } as Prisma.InputJsonValue,
        },
      });

      await prisma.activity.create({
        data: {
          tenantId,
          contactId: existing.contactId,
          prospectId: id,
          type: "NOTA",
          summary: `Movido de etapa "${existing.stage}" a "${stage}"`,
          result: "EXITOSO",
          performedBy: currentUserId,
          isAutomatic: true,
        },
      });
    }

    return updated;
  },

  async convertToClient(tenantId: string, id: string, currentUserId: string | null) {
    const existing = await prospectRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Prospecto");
    if (existing.status === "WON") {
      throw new ValidationError("Este prospecto ya fue convertido a cliente");
    }

    await prisma.$transaction([
      prisma.contact.update({
        where: { id: existing.contactId, tenantId },
        data: { type: "CLIENT", status: "ACTIVE" },
      }),
      prisma.prospect.update({
        where: { id, tenantId },
        data: { status: "WON", stage: "CIERRE", probability: 100 },
      }),
      ...(currentUserId
        ? [
            prisma.activity.create({
              data: {
                tenantId,
                contactId: existing.contactId,
                prospectId: id,
                type: "NOTA",
                summary: `Prospecto ${existing.code} convertido a cliente`,
                result: "EXITOSO",
                performedBy: currentUserId,
                isAutomatic: true,
              },
            }),
            prisma.auditLog.create({
              data: {
                tenantId,
                userId: currentUserId,
                entity: "prospects",
                entityId: id,
                action: "UPDATE",
                changes: {
                  action: "convert_to_client",
                  contactId: existing.contactId,
                } as Prisma.InputJsonValue,
              },
            }),
          ]
        : []),
    ]);

    return { contactId: existing.contactId };
  },

  async markAsLost(tenantId: string, id: string, currentUserId: string | null) {
    const existing = await prospectRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Prospecto");

    await prisma.$transaction([
      prisma.prospect.update({
        where: { id, tenantId },
        data: { status: "LOST", probability: 0 },
      }),
      ...(currentUserId
        ? [
            prisma.activity.create({
              data: {
                tenantId,
                contactId: existing.contactId,
                prospectId: id,
                type: "NOTA",
                summary: `Prospecto ${existing.code} marcado como perdido`,
                result: "FINALIZADO",
                performedBy: currentUserId,
                isAutomatic: true,
              },
            }),
            prisma.auditLog.create({
              data: {
                tenantId,
                userId: currentUserId,
                entity: "prospects",
                entityId: id,
                action: "UPDATE",
                changes: { action: "mark_lost" } as Prisma.InputJsonValue,
              },
            }),
          ]
        : []),
    ]);
  },

  async remove(tenantId: string, id: string, currentUserId: string | null) {
    const existing = await prospectRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Prospecto");

    await prospectRepository.delete(tenantId, id);

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: currentUserId,
          entity: "prospects",
          entityId: id,
          action: "DELETE",
          changes: { code: existing.code } as Prisma.InputJsonValue,
        },
      });
    }
  },
};
