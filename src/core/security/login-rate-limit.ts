const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function isLoginAllowed(email: string): boolean {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    return true;
  }

  return entry.count < MAX_ATTEMPTS;
}

export function recordFailedLogin(email: string): void {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  entry.count += 1;
}

export function clearLoginAttempts(email: string): void {
  attempts.delete(email.toLowerCase().trim());
}
