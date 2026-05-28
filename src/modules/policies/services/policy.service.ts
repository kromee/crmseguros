import type { Prisma } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/core/errors/app-error";
import { prisma } from "@/infrastructure/prisma/client";
import { eventService } from "@/modules/calendar/services/event.service";
import { policyRepository } from "../repositories/policy.repository";
import type {
  CreatePolicyInput,
  PoliciesFilters,
  UpdatePolicyInput,
} from "../schemas/policy.schema";

export const policyService = {
  async list(filters: PoliciesFilters) {
    return policyRepository.list(filters);
  },

  async listByContact(contactId: string) {
    return policyRepository.listByContact(contactId);
  },

  async getById(id: string) {
    const policy = await policyRepository.findById(id);
    if (!policy) throw new NotFoundError("Póliza");
    return policy;
  },

  async create(input: CreatePolicyInput, currentUserId: string | null) {
    const exists = await policyRepository.findByPolicyNumber(input.policyNumber);
    if (exists) {
      throw new ValidationError("Ya existe una póliza con ese número");
    }

    const policy = await policyRepository.create(input);

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "policies",
          entityId: policy.id,
          action: "CREATE",
          changes: {
            policyNumber: policy.policyNumber,
            type: policy.type,
            contactId: policy.contactId,
          } as Prisma.InputJsonValue,
        },
      });

      // Crear recordatorio automático de renovación si la póliza está activa
      // y vence en más de 30 días.
      if (policy.status === "ACTIVE") {
        const daysUntilEnd = Math.floor(
          (policy.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilEnd > 30) {
          const contact = await prisma.contact.findUnique({
            where: { id: policy.contactId },
            select: { fullName: true, assignedTo: true },
          });
          if (contact) {
            try {
              await eventService.createRenewalReminder({
                policyId: policy.id,
                policyNumber: policy.policyNumber,
                contactId: policy.contactId,
                contactName: contact.fullName,
                endDate: policy.endDate,
                userId: contact.assignedTo ?? currentUserId,
              });
            } catch {
              // No bloquear la creación de la póliza si falla el recordatorio.
            }
          }
        }
      }
    }

    return policy;
  },

  async renew(
    oldPolicyId: string,
    input: CreatePolicyInput,
    currentUserId: string | null
  ) {
    const old = await policyRepository.findById(oldPolicyId);
    if (!old) throw new NotFoundError("Póliza original");

    const alreadyRenewed = await prisma.policy.findFirst({
      where: { renewedFromId: oldPolicyId },
      select: { id: true, policyNumber: true, status: true },
    });
    if (alreadyRenewed) {
      throw new ValidationError(
        `Esta póliza ya fue renovada con el folio ${alreadyRenewed.policyNumber}. Renueva la póliza vigente.`
      );
    }

    if (input.policyNumber === old.policyNumber) {
      throw new ValidationError(
        "La póliza renovada debe tener un número nuevo. Captura el folio vigente."
      );
    }

    const dup = await policyRepository.findByPolicyNumber(input.policyNumber);
    if (dup) throw new ValidationError("Ya existe una póliza con ese número");

    const [, newPolicy] = await prisma.$transaction([
      prisma.policy.update({
        where: { id: oldPolicyId },
        data: { status: "EXPIRED" },
      }),
      prisma.policy.create({
        data: {
          contactId: input.contactId,
          policyNumber: input.policyNumber,
          type: input.type,
          plan: input.plan ?? null,
          insurer: input.insurer ?? null,
          startDate: input.startDate,
          endDate: input.endDate,
          paymentFrequency: input.paymentFrequency,
          premium: input.premium,
          sumInsured: input.sumInsured ?? null,
          beneficiaries: input.beneficiaries ?? null,
          status: "ACTIVE",
          notes: input.notes ?? null,
          insuredAsset: input.insuredAsset ?? null,
          coverageType: input.coverageType ?? null,
          vehiclePhoto: input.vehiclePhoto ?? null,
          currency: input.currency ?? null,
          term: input.term ?? null,
          renewedFromId: oldPolicyId,
        },
      }),
    ]);

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "policies",
          entityId: newPolicy.id,
          action: "CREATE",
          changes: {
            action: "RENEWAL",
            renewedFrom: oldPolicyId,
            oldPolicyNumber: old.policyNumber,
            newPolicyNumber: newPolicy.policyNumber,
          } as Prisma.InputJsonValue,
        },
      });

      const daysUntilEnd = Math.floor(
        (newPolicy.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilEnd > 30) {
        const contact = await prisma.contact.findUnique({
          where: { id: newPolicy.contactId },
          select: { fullName: true, assignedTo: true },
        });
        if (contact) {
          try {
            await eventService.createRenewalReminder({
              policyId: newPolicy.id,
              policyNumber: newPolicy.policyNumber,
              contactId: newPolicy.contactId,
              contactName: contact.fullName,
              endDate: newPolicy.endDate,
              userId: contact.assignedTo ?? currentUserId,
            });
          } catch {
            // No bloquear la renovación si falla el recordatorio
          }
        }
      }
    }

    return newPolicy;
  },

  async update(id: string, input: UpdatePolicyInput, currentUserId: string | null) {
    const existing = await policyRepository.findById(id);
    if (!existing) throw new NotFoundError("Póliza");

    if (input.policyNumber && input.policyNumber !== existing.policyNumber) {
      const dup = await policyRepository.findByPolicyNumber(input.policyNumber);
      if (dup) throw new ValidationError("Ya existe una póliza con ese número");
    }

    const updated = await policyRepository.update(id, input);

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "policies",
          entityId: id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue,
        },
      });
    }

    return updated;
  },

  async remove(id: string, currentUserId: string | null) {
    const existing = await policyRepository.findById(id);
    if (!existing) throw new NotFoundError("Póliza");

    await policyRepository.delete(id);

    if (currentUserId) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          entity: "policies",
          entityId: id,
          action: "DELETE",
          changes: {
            policyNumber: existing.policyNumber,
          } as Prisma.InputJsonValue,
        },
      });
    }
  },
};
