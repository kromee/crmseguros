import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import type {
  CreateProspectInput,
  ProspectsFilters,
  UpdateProspectInput,
} from "../schemas/prospect.schema";

export const prospectRepository = {
  async findById(id: string) {
    return prisma.prospect.findUnique({
      where: { id },
      include: {
        contact: {
          select: {
            id: true,
            code: true,
            fullName: true,
            phone: true,
            email: true,
            type: true,
          },
        },
        assignedUser: { select: { id: true, name: true, title: true } },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            performer: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  async findByCode(code: string) {
    return prisma.prospect.findUnique({ where: { code } });
  },

  async list(filters: ProspectsFilters) {
    const where: Prisma.ProspectWhereInput = {};
    if (filters.stage) where.stage = filters.stage;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { code: { contains: q } },
        { serviceOfInterest: { contains: q } },
        { contact: { fullName: { contains: q } } },
        { contact: { code: { contains: q } } },
      ];
    }

    return prisma.prospect.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: {
        contact: {
          select: { id: true, code: true, fullName: true, phone: true, email: true },
        },
        assignedUser: { select: { id: true, name: true } },
      },
    });
  },

  async listByStage(filters: ProspectsFilters) {
    const items = await this.list({ ...filters, status: filters.status ?? "ACTIVE" });
    const grouped: Record<string, typeof items> = {
      CONTACTO_INICIAL: [],
      SEGUIMIENTO: [],
      COTIZACION: [],
      CIERRE: [],
    };
    items.forEach((p) => {
      if (grouped[p.stage]) grouped[p.stage].push(p);
    });
    return grouped;
  },

  async countByStage() {
    const rows = await prisma.prospect.groupBy({
      by: ["stage"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
      _sum: { estimatedValue: true },
    });
    return rows.reduce<
      Record<string, { count: number; totalValue: number }>
    >((acc, r) => {
      acc[r.stage] = {
        count: r._count._all,
        totalValue: Number(r._sum.estimatedValue?.toString() ?? 0),
      };
      return acc;
    }, {});
  },

  async create(input: CreateProspectInput, code: string) {
    return prisma.prospect.create({
      data: {
        code,
        contactId: input.contactId,
        stage: input.stage,
        priority: input.priority,
        serviceOfInterest: input.serviceOfInterest ?? null,
        estimatedValue: input.estimatedValue ?? null,
        probability: input.probability,
        assignedTo: input.assignedTo ?? null,
        notes: input.notes ?? null,
        nextActionType: input.nextActionType ?? null,
        nextActionDate: input.nextActionDate,
        rating: input.rating,
        status: input.status,
      },
    });
  },

  async update(id: string, input: UpdateProspectInput) {
    return prisma.prospect.update({
      where: { id },
      data: {
        ...(input.stage !== undefined && { stage: input.stage }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.serviceOfInterest !== undefined && {
          serviceOfInterest: input.serviceOfInterest ?? null,
        }),
        ...(input.estimatedValue !== undefined && {
          estimatedValue: input.estimatedValue ?? null,
        }),
        ...(input.probability !== undefined && { probability: input.probability }),
        ...(input.assignedTo !== undefined && {
          assignedTo: input.assignedTo ?? null,
        }),
        ...(input.notes !== undefined && { notes: input.notes ?? null }),
        ...(input.nextActionType !== undefined && {
          nextActionType: input.nextActionType ?? null,
        }),
        ...(input.nextActionDate !== undefined && {
          nextActionDate: input.nextActionDate,
        }),
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.status !== undefined && { status: input.status }),
      },
    });
  },

  async updateStage(id: string, stage: string) {
    return prisma.prospect.update({
      where: { id },
      data: {
        stage: stage as never,
        nextActionType: null,
        nextActionDate: null,
      },
    });
  },

  async delete(id: string) {
    return prisma.prospect.delete({ where: { id } });
  },

  async nextCodeNumber() {
    const last = await prisma.prospect.findFirst({
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });
    if (!last) return 100;
    const match = last.code.match(/PR-(\d+)/);
    return match ? Number(match[1]) + 1 : 100;
  },
};

export type ProspectListItem = Awaited<ReturnType<typeof prospectRepository.list>>[number];
export type ProspectWithRelations = NonNullable<
  Awaited<ReturnType<typeof prospectRepository.findById>>
>;
