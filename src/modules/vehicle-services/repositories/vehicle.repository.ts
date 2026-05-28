import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehiclesFilters,
} from "../schemas/vehicle.schema";

export const vehicleRepository = {
  async findById(id: string) {
    return prisma.vehicleService.findUnique({
      where: { id },
      include: { contact: { select: { id: true, code: true, fullName: true } } },
    });
  },

  async listByContact(contactId: string) {
    return prisma.vehicleService.findMany({
      where: { contactId },
      orderBy: { startDate: "desc" },
    });
  },

  async list(filters: VehiclesFilters) {
    const where: Prisma.VehicleServiceWhereInput = {};
    if (filters.contactId) where.contactId = filters.contactId;
    if (filters.status) where.status = filters.status;
    if (filters.serviceType) where.serviceType = filters.serviceType;
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
      prisma.vehicleService.findMany({
        where,
        orderBy: { startDate: "desc" },
        skip,
        take: filters.pageSize,
        include: { contact: { select: { id: true, code: true, fullName: true } } },
      }),
      prisma.vehicleService.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    };
  },

  async create(input: CreateVehicleInput) {
    const documents = {
      checklist: input.documentChecklist ?? {
        ine: false,
        tarjetaCirculacion: false,
        factura: false,
        titulo: false,
      },
      files: input.documentFiles ?? {},
    };

    return prisma.vehicleService.create({
      data: {
        contactId: input.contactId,
        startDate: input.startDate,
        serviceType: input.serviceType,
        requestMode: input.requestMode,
        description: input.description ?? null,
        quote: input.quote ?? null,
        status: input.status,
        documents: documents as Prisma.InputJsonValue,
      },
    });
  },

  async update(id: string, input: UpdateVehicleInput) {
    const data: Prisma.VehicleServiceUpdateInput = {
      ...(input.startDate !== undefined && input.startDate !== null && {
        startDate: input.startDate,
      }),
      ...(input.serviceType !== undefined && { serviceType: input.serviceType }),
      ...(input.requestMode !== undefined && { requestMode: input.requestMode }),
      ...(input.description !== undefined && { description: input.description ?? null }),
      ...(input.quote !== undefined && { quote: input.quote ?? null }),
      ...(input.status !== undefined && { status: input.status }),
    };

    if (input.documentChecklist !== undefined || input.documentFiles !== undefined) {
      const current = await prisma.vehicleService.findUnique({
        where: { id },
        select: { documents: true },
      });
      const currentDocs = (current?.documents as {
        checklist?: Record<string, boolean>;
        files?: Record<string, string | null>;
      } | null) ?? { checklist: {}, files: {} };

      data.documents = {
        checklist: input.documentChecklist ?? currentDocs.checklist ?? {},
        files: input.documentFiles ?? currentDocs.files ?? {},
      } as Prisma.InputJsonValue;
    }

    return prisma.vehicleService.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.vehicleService.delete({ where: { id } });
  },
};

export type VehicleListItem = Awaited<ReturnType<typeof vehicleRepository.list>>["items"][number];
