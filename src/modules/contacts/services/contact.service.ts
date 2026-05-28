import type { Prisma } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/core/errors/app-error";
import { prisma } from "@/infrastructure/prisma/client";
import { contactRepository } from "../repositories/contact.repository";
import type {
  ContactsFilters,
  CreateContactInput,
  UpdateContactInput,
} from "../schemas/contact.schema";

async function generateContactCode(): Promise<string> {
  const next = await contactRepository.nextCodeNumber();
  return `SM-${next}`;
}

export const contactService = {
  async list(filters: ContactsFilters) {
    return contactRepository.list(filters);
  },

  async getById(id: string) {
    const contact = await contactRepository.findById(id);
    if (!contact) {
      throw new NotFoundError("Contacto");
    }
    return contact;
  },

  async create(input: CreateContactInput, currentUserId: string | null) {
    if (input.email) {
      const existing = await prisma.contact.findFirst({
        where: { email: input.email },
        select: { id: true },
      });
      if (existing) {
        throw new ValidationError("Ya existe un contacto con ese correo");
      }
    }

    const code = await generateContactCode();
    const contact = await contactRepository.create(input, code, currentUserId);

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
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
  },

  async update(id: string, input: UpdateContactInput, currentUserId: string | null) {
    const existing = await contactRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Contacto");
    }

    const updated = await contactRepository.update(id, input);

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
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

  async remove(id: string, currentUserId: string | null) {
    const existing = await contactRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Contacto");
    }

    await contactRepository.delete(id);

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
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
