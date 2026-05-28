import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import type {
  ContactsFilters,
  CreateContactInput,
  UpdateContactInput,
} from "../schemas/contact.schema";

export const contactRepository = {
  async findById(id: string) {
    return prisma.contact.findUnique({
      where: { id },
      include: {
        assignedUser: { select: { id: true, name: true, title: true } },
        policies: {
          orderBy: { createdAt: "desc" },
          include: {
            payments: { orderBy: { paymentDate: "desc" } },
            renewedBy: {
              select: { id: true, policyNumber: true, status: true },
            },
          },
        },
        pensionServices: { orderBy: { createdAt: "desc" } },
        vehicleServices: { orderBy: { createdAt: "desc" } },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            performer: { select: { id: true, name: true, title: true } },
          },
        },
      },
    });
  },

  async findByCode(code: string) {
    return prisma.contact.findUnique({ where: { code } });
  },

  async list(filters: ContactsFilters) {
    const where: Prisma.ContactWhereInput = {};

    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.origin) where.origin = filters.origin;

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { code: { contains: q } },
      ];
    }

    const skip = (filters.page - 1) * filters.pageSize;

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.pageSize,
        include: {
          assignedUser: { select: { id: true, name: true } },
          _count: { select: { policies: true, prospects: true } },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    };
  },

  async countByType() {
    const rows = await prisma.contact.groupBy({
      by: ["type"],
      _count: { _all: true },
    });
    return rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = r._count._all;
      return acc;
    }, {});
  },

  async create(input: CreateContactInput, code: string, assignedTo: string | null) {
    return prisma.contact.create({
      data: {
        code,
        type: input.type,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email ?? null,
        photo: input.photo ?? null,
        birthDate: input.birthDate,
        activity: input.activity ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        origin: input.origin,
        status: input.status,
        notes: input.notes ?? null,
        assignedTo,
      },
    });
  },

  async update(id: string, input: UpdateContactInput) {
    return prisma.contact.update({
      where: { id },
      data: {
        ...(input.type !== undefined && { type: input.type }),
        ...(input.fullName !== undefined && { fullName: input.fullName }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email ?? null }),
        ...(input.photo !== undefined && { photo: input.photo ?? null }),
        ...(input.birthDate !== undefined && { birthDate: input.birthDate }),
        ...(input.activity !== undefined && { activity: input.activity ?? null }),
        ...(input.city !== undefined && { city: input.city ?? null }),
        ...(input.state !== undefined && { state: input.state ?? null }),
        ...(input.origin !== undefined && { origin: input.origin }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes ?? null }),
      },
    });
  },

  async delete(id: string) {
    return prisma.contact.delete({ where: { id } });
  },

  async nextCodeNumber() {
    const last = await prisma.contact.findFirst({
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });
    if (!last) return 1000;
    const match = last.code.match(/SM-(\d+)/);
    return match ? Number(match[1]) + 1 : 1000;
  },
};

export type ContactListItem = Awaited<ReturnType<typeof contactRepository.list>>["items"][number];
export type ContactWithRelations = NonNullable<Awaited<ReturnType<typeof contactRepository.findById>>>;
