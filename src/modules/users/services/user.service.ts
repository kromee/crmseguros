import bcrypt from "bcryptjs";
import { NotFoundError, ValidationError } from "@/core/errors/app-error";
import { assertCanAddUser, assertTenantCanOperate } from "@/core/tenant/entitlements";
import { isSuperAdmin } from "@/core/tenant/roles";
import { prisma } from "@/infrastructure/prisma/client";
import type { UserRole } from "@prisma/client";
import { clearSession, isSessionActive } from "@/modules/auth/services/session.service";
import type { CreateUserInput } from "../schemas/user.schema";

export type TenantUserListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  isOnline: boolean;
  lastActiveAt: Date | null;
};

export const userService = {
  async list(tenantId: string): Promise<TenantUserListItem[]> {
    const rows = await prisma.user.findMany({
      where: { tenantId },
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
        sessionNonce: true,
        sessionActiveAt: true,
      },
    });

    return rows.map(({ sessionNonce, sessionActiveAt, ...user }) => ({
      ...user,
      isOnline: isSessionActive(sessionNonce, sessionActiveAt),
      lastActiveAt: sessionActiveAt,
    }));
  },

  async create(tenantId: string, input: CreateUserInput, currentUserId: string) {
    await assertTenantCanOperate(tenantId);
    if (input.isActive) {
      await assertCanAddUser(tenantId);
    }

    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new ValidationError("Ya existe un usuario con ese correo");

    const password = await bcrypt.hash(input.password, 10);
    const created = await prisma.user.create({
      data: {
        tenantId,
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
        tenantId,
        userId: currentUserId,
        entity: "users",
        entityId: created.id,
        action: "CREATE",
        changes: { email: created.email, role: created.role, isActive: created.isActive },
      },
    });

    return created;
  },

  async setActive(
    tenantId: string,
    userId: string,
    isActive: boolean,
    currentUserId: string
  ) {
    const existing = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!existing) throw new NotFoundError("Usuario");

    if (!existing.isActive && isActive) {
      await assertCanAddUser(tenantId);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUserId,
        entity: "users",
        entityId: userId,
        action: "UPDATE",
        changes: { isActiveFrom: existing.isActive, isActiveTo: isActive },
      },
    });

    return updated;
  },

  async forceLogoutByAdmin(
    tenantId: string,
    targetUserId: string,
    currentUserId: string
  ) {
    if (targetUserId === currentUserId) {
      throw new ValidationError("No puedes cerrar tu propia sesión desde aquí");
    }

    const target = await prisma.user.findFirst({
      where: { id: targetUserId, tenantId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        sessionNonce: true,
        sessionActiveAt: true,
      },
    });
    if (!target) throw new NotFoundError("Usuario");
    if (!target.isActive) throw new ValidationError("El usuario está desactivado");
    if (target.role !== "USER") {
      throw new ValidationError("Solo puedes cerrar sesión de agentes (USER)");
    }
    if (!isSessionActive(target.sessionNonce, target.sessionActiveAt)) {
      throw new ValidationError("El usuario no tiene una sesión activa");
    }

    await assertTenantCanOperate(tenantId);
    await clearSession(targetUserId);

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUserId,
        entity: "users",
        entityId: targetUserId,
        action: "UPDATE",
        changes: {
          event: "session_forced_logout_by_admin",
          targetEmail: target.email,
        },
      },
    });
  },

  async setAvatar(
    tenantId: string,
    userId: string,
    avatar: string | null,
    currentUserId: string
  ) {
    const existing = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!existing) throw new NotFoundError("Usuario");

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: currentUserId,
        entity: "users",
        entityId: userId,
        action: "UPDATE",
        changes: { avatarUpdated: Boolean(avatar) },
      },
    });

    return updated;
  },

  async getProfile(tenantId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        avatar: true,
        role: true,
      },
    });
    if (!user) throw new NotFoundError("Usuario");
    return user;
  },

  async updateProfile(
    tenantId: string,
    userId: string,
    input: { name: string; title?: string }
  ) {
    const existing = await prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!existing) throw new NotFoundError("Usuario");

    return prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        title: input.title ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        avatar: true,
        role: true,
      },
    });
  },

  async changePassword(
    tenantId: string,
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundError("Usuario");

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new ValidationError("La contraseña actual es incorrecta");
    }

    const password = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        entity: "users",
        entityId: userId,
        action: "UPDATE",
        changes: { event: "password_changed" },
      },
    });
  },

  /**
   * Restablecer contraseña por administrador (sin correo).
   * - TENANT_ADMIN → solo usuarios USER de su agencia
   * - SUPER_ADMIN → solo usuarios TENANT_ADMIN de agencias
   */
  async setPasswordByAdmin(
    actor: { userId: string; role: UserRole; tenantId: string | null },
    targetUserId: string,
    newPassword: string
  ) {
    if (targetUserId === actor.userId) {
      throw new ValidationError("Usa Mi perfil para cambiar tu propia contraseña");
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true, tenantId: true, isActive: true },
    });
    if (!target) throw new NotFoundError("Usuario");
    if (!target.isActive) throw new ValidationError("El usuario está desactivado");

    if (isSuperAdmin(actor.role)) {
      if (target.role !== "TENANT_ADMIN") {
        throw new ValidationError("Solo puedes restablecer contraseñas de administradores de agencia");
      }
      if (!target.tenantId) {
        throw new ValidationError("El administrador no pertenece a una agencia");
      }
    } else if (actor.role === "TENANT_ADMIN") {
      if (!actor.tenantId || target.tenantId !== actor.tenantId) {
        throw new ValidationError("No puedes modificar usuarios de otra agencia");
      }
      if (target.role !== "USER") {
        throw new ValidationError("Solo puedes restablecer contraseñas de agentes (USER)");
      }
      await assertTenantCanOperate(actor.tenantId);
    } else {
      throw new ValidationError("No tienes permiso para restablecer contraseñas");
    }

    const password = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: targetUserId },
      data: { password },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: target.tenantId,
        userId: actor.userId,
        entity: "users",
        entityId: targetUserId,
        action: "UPDATE",
        changes: {
          event: "password_reset_by_admin",
          targetEmail: target.email,
          targetRole: target.role,
        },
      },
    });
  },
};
