import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import {
  clearLoginAttempts,
  isLoginAllowed,
  recordFailedLogin,
} from "@/core/security/login-rate-limit";
import { getTenantEntitlements } from "@/core/tenant/entitlements";

export type AuthUser = Pick<User, "id" | "name" | "email" | "role" | "title" | "avatar" | "tenantId"> & {
  image?: string | null;
};

export async function validateCredentials(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const normalizedEmail = email.toLowerCase().trim();

  if (!isLoginAllowed(normalizedEmail)) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      title: true,
      avatar: true,
      password: true,
      isActive: true,
      tenantId: true,
      tenant: { select: { status: true } },
    },
  });

  if (!user || !user.isActive) {
    recordFailedLogin(normalizedEmail);
    return null;
  }

  if (user.tenantId && user.tenant?.status !== "ACTIVE") {
    recordFailedLogin(normalizedEmail);
    return null;
  }

  if (user.tenantId) {
    const entitlements = await getTenantEntitlements(user.tenantId);
    if (!entitlements.canOperate) {
      recordFailedLogin(normalizedEmail);
      return null;
    }
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    recordFailedLogin(normalizedEmail);
    return null;
  }

  clearLoginAttempts(normalizedEmail);

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      tenantId: user.tenantId,
      entity: "users",
      entityId: user.id,
      action: "VIEW",
      changes: { event: "login" },
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title,
    avatar: user.avatar,
    tenantId: user.tenantId,
    image: user.avatar ? `/api/files/${user.avatar}` : null,
  };
}
