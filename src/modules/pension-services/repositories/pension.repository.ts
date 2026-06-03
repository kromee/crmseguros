import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import type {
  CreatePensionInput,
  PensionsFilters,
  UpdatePensionInput,
} from "../schemas/pension.schema";

export const pensionRepository = {
  async findById(tenantId: string, id: string) {
    return prisma.pensionService.findFirst({
      where: { id, tenantId },
      include: { contact: { select: { id: true, code: true, fullName: true } } },
    });
  },

  async listByContact(tenantId: string, contactId: string) {
    return prisma.pensionService.findMany({
      where: { tenantId, contactId },
      orderBy: { requestDate: "desc" },
    });
  },

  async list(tenantId: string, filters: PensionsFilters) {
    const where: Prisma.PensionServiceWhereInput = { tenantId };
    if (filters.contactId) where.contactId = filters.contactId;
    if (filters.status) where.status = filters.status;
    if (filters.requestType) where.requestType = filters.requestType;
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { description: { contains: q } },
        { contact: { fullName: { contains: q } } },
        { contact: { code: { contains: q } } },
      ];
    }

    const skip = (filters.page - 1) * filters.pageSize;
    const [items, total] = await Promise.all([
      prisma.pensionService.findMany({
        where,
        orderBy: { requestDate: "desc" },
        skip,
        take: filters.pageSize,
        include: { contact: { select: { id: true, code: true, fullName: true } } },
      }),
      prisma.pensionService.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    };
  },

  async create(tenantId: string, input: CreatePensionInput) {
    return prisma.pensionService.create({
      data: {
        tenantId,
        contactId: input.contactId,
        requestDate: input.requestDate,
        requestType: input.requestType,
        pensionLaw: input.pensionLaw ?? null,
        cost: input.cost,
        advance: input.advance ?? null,
        advanceDate: input.advanceDate,
        settlement: input.settlement ?? null,
        settlementDate: input.settlementDate,
        description: input.description ?? null,
        bitacora: input.bitacora ?? null,
        status: input.status,
      },
    });
  },

  async update(tenantId: string, id: string, input: UpdatePensionInput) {
    return prisma.pensionService.update({
      where: { id, tenantId },
      data: {
        ...(input.requestDate !== undefined && input.requestDate !== null && {
          requestDate: input.requestDate,
        }),
        ...(input.requestType !== undefined && { requestType: input.requestType }),
        ...(input.pensionLaw !== undefined && { pensionLaw: input.pensionLaw ?? null }),
        ...(input.cost !== undefined && input.cost !== null && { cost: input.cost }),
        ...(input.advance !== undefined && { advance: input.advance ?? null }),
        ...(input.advanceDate !== undefined && { advanceDate: input.advanceDate }),
        ...(input.settlement !== undefined && { settlement: input.settlement ?? null }),
        ...(input.settlementDate !== undefined && { settlementDate: input.settlementDate }),
        ...(input.description !== undefined && { description: input.description ?? null }),
        ...(input.bitacora !== undefined && { bitacora: input.bitacora ?? null }),
        ...(input.status !== undefined && { status: input.status }),
      },
    });
  },

  async delete(tenantId: string, id: string) {
    return prisma.pensionService.delete({ where: { id, tenantId } });
  },
};

export type PensionListItem = Awaited<ReturnType<typeof pensionRepository.list>>["items"][number];
