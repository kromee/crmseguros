import { prisma } from "@/infrastructure/prisma/client";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

/** Primera capa en memoria; la fuente de verdad es MySQL (sobrevive reinicios y PM2 cluster) */
const memoryCache = new Map<string, { count: number; resetAt: number }>();

function cacheKey(email: string): string {
  return email.toLowerCase().trim();
}

function readMemory(key: string, now: number) {
  const entry = memoryCache.get(key);
  if (!entry || now > entry.resetAt) return null;
  return entry;
}

export async function isLoginAllowed(email: string): Promise<boolean> {
  const key = cacheKey(email);
  const now = Date.now();
  const cached = readMemory(key, now);
  if (cached) return cached.count < MAX_ATTEMPTS;

  const row = await prisma.loginRateLimit.findUnique({ where: { email: key } });
  if (!row || row.resetAt.getTime() <= now) return true;

  memoryCache.set(key, { count: row.attemptCount, resetAt: row.resetAt.getTime() });
  return row.attemptCount < MAX_ATTEMPTS;
}

export async function recordFailedLogin(email: string, ipAddress?: string | null): Promise<void> {
  const key = cacheKey(email);
  const now = Date.now();
  const row = await prisma.loginRateLimit.findUnique({ where: { email: key } });

  let attemptCount = 1;
  let resetAt = new Date(now + WINDOW_MS);

  if (row && row.resetAt.getTime() > now) {
    attemptCount = row.attemptCount + 1;
    resetAt = row.resetAt;
  }

  await prisma.loginRateLimit.upsert({
    where: { email: key },
    create: {
      email: key,
      attemptCount,
      resetAt,
      lastIp: ipAddress ?? null,
    },
    update: {
      attemptCount,
      resetAt,
      ...(ipAddress ? { lastIp: ipAddress } : {}),
    },
  });

  memoryCache.set(key, { count: attemptCount, resetAt: resetAt.getTime() });
}

export async function clearLoginAttempts(email: string): Promise<void> {
  const key = cacheKey(email);
  memoryCache.delete(key);
  await prisma.loginRateLimit.deleteMany({ where: { email: key } });
}
