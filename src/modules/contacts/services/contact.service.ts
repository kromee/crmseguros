import { Prisma } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/core/errors/app-error";
import { prisma } from "@/infrastructure/prisma/client";
import { contactRepository } from "../repositories/contact.repository";
import type {
  ContactsFilters,
  CreateContactInput,
  UpdateContactInput,
} from "../schemas/contact.schema";

const MAX_CODE_RETRIES = 5;

async function generateContactCode(tenantId: string): Promise<string> {
  const next = await contactRepository.nextCodeNumber(tenantId);
  return `SM-${next}`;
}

function isContactCodeConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export const contactService = {
  async list(tenantId: string, filters: ContactsFilters) {
    return contactRepository.list(tenantId, filters);
  },

  async getById(tenantId: string, id: string) {
    const contact = await contactRepository.findById(tenantId, id);
    if (!contact) {
      throw new NotFoundError("Contacto");
    }
    return contact;
  },

  async create(
    tenantId: string,
    input: CreateContactInput,
    currentUserId: string | null
  ) {
    if (input.email) {
      const existing = await prisma.contact.findFirst({
        where: { tenantId, email: input.email },
        select: { id: true },
      });
      if (existing) {
        throw new ValidationError("Ya existe un contacto con ese correo");
      }
    }

    const maxRetries = MAX_CODE_RETRIES;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const code = await generateContactCode(tenantId);
      try {
        const contact = await contactRepository.create(
          tenantId,
          input,
          code,
          currentUserId
        );

        if (currentUserId) {
          await prisma.auditLog.create({
            data: {
              tenantId,
              userId: currentUserId,
              entity: "contacts",
              entityId: contact.id,
              action: "CREATE",
              changes: {
                code,
                fullName: contact.fullName,
                type: contact.type,
              } as Prisma.InputJsonValue,
            },
          });
        }

        return contact;
      } catch (error) {
        if (isContactCodeConflict(error) && attempt < maxRetries - 1) {
          continue;
        }
        throw error;
      }
    }

    throw new ValidationError("No se pudo generar un código de contacto único");
  },

  async update(
    tenantId: string,
    id: string,
    input: UpdateContactInput,
    currentUserId: string | null
  ) {
    const existing = await contactRepository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundError("Contacto");
    }

    const updated = await contactRepository.update(tenantId, id, input);

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: currentUserId,
          entity: "contacts",
          entityId: id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue,
        },
      });
    }

    return updated;
  },

  async remove(tenantId: string, id: string, currentUserId: string | null) {
    const existing = await contactRepository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundError("Contacto");
    }

    await contactRepository.delete(tenantId, id);

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: currentUserId,
          entity: "contacts",
          entityId: id,
          action: "DELETE",
          changes: {
            code: existing.code,
            fullName: existing.fullName,
          } as Prisma.InputJsonValue,
        },
      });
    }
  },
};
