import type { DefaultSession } from "next-auth";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      tenantId: string | null;
      title?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    tenantId?: string | null;
    title?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    tenantId?: string | null;
    title?: string | null;
    avatar?: string | null;
    sessionNonce?: string;
    error?: "SessionInvalid";
  }
}
