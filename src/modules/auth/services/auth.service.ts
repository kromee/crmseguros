import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import {
  clearLoginAttempts,
  isLoginAllowed,
  recordFailedLogin,
} from "@/core/security/login-rate-limit";

export type AuthUser = Pick<User, "id" | "name" | "email" | "role" | "title" | "avatar"> & {
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
    select: { id: true, name: true, email: true, role: true, title: true, avatar: true, password: true, isActive: true },
  });

  if (!user || !user.isActive) {
    recordFailedLogin(normalizedEmail);
    return null;
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
    image: user.avatar ? `/api/files/${user.avatar}` : null,
  };
}
