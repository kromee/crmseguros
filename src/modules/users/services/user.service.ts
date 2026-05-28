import bcrypt from "bcryptjs";
import { NotFoundError, ValidationError } from "@/core/errors/app-error";
import { prisma } from "@/infrastructure/prisma/client";
import type { CreateUserInput } from "../schemas/user.schema";

export const userService = {
  async list() {
    return prisma.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        title: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });
  },

  async create(input: CreateUserInput, currentUserId: string) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new ValidationError("Ya existe un usuario con ese correo");

    const password = await bcrypt.hash(input.password, 10);
    const created = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password,
        role: input.role,
        title: input.title ?? null,
        isActive: input.isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        entity: "users",
        entityId: created.id,
        action: "CREATE",
        changes: { email: created.email, role: created.role, isActive: created.isActive },
      },
    });

    return created;
  },

  async setActive(userId: string, isActive: boolean, currentUserId: string) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundError("Usuario");

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        entity: "users",
        entityId: userId,
        action: "UPDATE",
        changes: { isActiveFrom: existing.isActive, isActiveTo: isActive },
      },
    });

    return updated;
  },

  async setAvatar(userId: string, avatar: string | null, currentUserId: string) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundError("Usuario");

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        entity: "users",
        entityId: userId,
        action: "UPDATE",
        changes: { avatarUpdated: Boolean(avatar) },
      },
    });

    return updated;
  },
};
