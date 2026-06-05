"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";
import { loginActionSchema } from "@/modules/auth/schemas/login.schema";
import { validateCredentials } from "@/modules/auth/services/auth.service";
import { clearSession, hasActiveSession } from "@/modules/auth/services/session.service";
import { isLoginAllowed } from "@/core/security/login-rate-limit";
import { prisma } from "@/infrastructure/prisma/client";

export type LoginErrorCode = "invalid" | "active_session" | "rate_limit";

export type LoginActionResult =
  | { ok: true }
  | {
      ok: false;
      code: LoginErrorCode;
      canTakeover?: boolean;
    };

function resolveLoginErrorCode(error: unknown): LoginErrorCode {
  let current: unknown = error;

  while (current) {
    if (current instanceof CredentialsSignin && current.code) {
      if (current.code === "active_session") return "active_session";
      if (current.code === "rate_limit") return "rate_limit";
    }

    if (current instanceof AuthError) {
      const nested = (current.cause as { err?: unknown } | undefined)?.err;
      if (nested) {
        current = nested;
        continue;
      }
    }

    if (current instanceof Error && current.cause) {
      current = current.cause;
      continue;
    }

    break;
  }

  return "invalid";
}

export async function credentialsLoginAction(
  raw: unknown
): Promise<LoginActionResult> {
  const parsed = loginActionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "invalid" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  if (!(await isLoginAllowed(email))) {
    return { ok: false, code: "rate_limit" };
  }

  const user = await validateCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return { ok: false, code: "invalid" };
  }

  if (await hasActiveSession(user.id)) {
    if (user.role === "TENANT_ADMIN" && parsed.data.takeoverSession) {
      await clearSession(user.id);
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId ?? null,
          entity: "users",
          entityId: user.id,
          action: "UPDATE",
          changes: { event: "session_takeover_by_password" },
        },
      });
    } else if (user.role === "TENANT_ADMIN") {
      return { ok: false, code: "active_session", canTakeover: true };
    } else {
      return { ok: false, code: "active_session" };
    }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, code: resolveLoginErrorCode(error) };
  }
}
