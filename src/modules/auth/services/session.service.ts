import { randomUUID } from "crypto";
import { prisma } from "@/infrastructure/prisma/client";

/** Debe coincidir con session.maxAge en auth.config.ts (8 h) */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export async function hasActiveSession(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionNonce: true, sessionActiveAt: true },
  });
  if (!user) return false;
  return isSessionActive(user.sessionNonce, user.sessionActiveAt);
}

/** Evalúa sesión activa sin consulta extra (p. ej. listado de usuarios) */
export function isSessionActive(
  sessionNonce: string | null | undefined,
  sessionActiveAt: Date | null | undefined
): boolean {
  if (!sessionNonce || !sessionActiveAt) return false;
  return Date.now() - sessionActiveAt.getTime() < SESSION_TTL_MS;
}

export async function startSession(userId: string): Promise<string> {
  const nonce = randomUUID();
  const now = new Date();
  await prisma.user.update({
    where: { id: userId },
    data: { sessionNonce: nonce, sessionActiveAt: now },
  });
  return nonce;
}

export async function touchSessionActivity(userId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { id: userId, sessionNonce: { not: null } },
    data: { sessionActiveAt: new Date() },
  });
}

export async function isSessionNonceValid(
  userId: string,
  nonce: string | undefined
): Promise<boolean> {
  if (!nonce) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionNonce: true, sessionActiveAt: true },
  });
  if (!user?.sessionNonce || !user.sessionActiveAt) return false;
  if (Date.now() - user.sessionActiveAt.getTime() >= SESSION_TTL_MS) return false;

  return user.sessionNonce === nonce;
}

export async function clearSession(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionNonce: null, sessionActiveAt: null },
  });
}
