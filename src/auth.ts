import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig, type AppJwt } from "@/auth.config";
import { loginSchema } from "@/modules/auth/schemas/login.schema";
import { validateCredentials } from "@/modules/auth/services/auth.service";
import { ActiveSessionSignin } from "@/modules/auth/errors/auth-errors";
import {
  hasActiveSession,
  isSessionNonceValid,
  startSession,
  touchSessionActivity,
  clearSession,
} from "@/modules/auth/services/session.service";
import { prisma } from "@/infrastructure/prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await validateCredentials(parsed.data.email, parsed.data.password);
        if (!user) return null;

        if (await hasActiveSession(user.id)) {
          throw new ActiveSessionSignin();
        }

        return user;
      },
    }),
  ],
  events: {
    async signOut(message) {
      const token = "token" in message ? (message.token as AppJwt | null) : null;
      if (token?.id) {
        await clearSession(token.id);
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const appToken = token as AppJwt;

      if (user?.id && user.role) {
        appToken.id = user.id;
        appToken.role = user.role;
        appToken.tenantId = user.tenantId ?? null;
        appToken.title = user.title ?? null;
        appToken.avatar = user.image ?? null;
        delete appToken.error;
        appToken.sessionNonce = await startSession(user.id);

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            tenantId: user.tenantId ?? null,
            entity: "users",
            entityId: user.id,
            action: "VIEW",
            changes: { event: "login" },
          },
        });

        return appToken;
      }

      if (trigger === "update" && session) {
        const data = session as {
          name?: string;
          title?: string | null;
          image?: string | null;
        };
        if (data.name !== undefined) appToken.name = data.name;
        if (data.title !== undefined) appToken.title = data.title;
        if (data.image !== undefined) appToken.avatar = data.image;
      }

      if (appToken.id && appToken.sessionNonce) {
        const valid = await isSessionNonceValid(appToken.id, appToken.sessionNonce);
        if (!valid) {
          appToken.error = "SessionInvalid";
          return appToken;
        }
        await touchSessionActivity(appToken.id);
      }

      return appToken;
    },
    async session({ session, token }) {
      const appToken = token as AppJwt;

      if (appToken.error === "SessionInvalid") {
        return {
          ...session,
          user: undefined,
          expires: new Date(0).toISOString(),
        };
      }

      if (session.user && appToken.id && appToken.role) {
        session.user.id = appToken.id;
        session.user.role = appToken.role;
        session.user.tenantId = appToken.tenantId ?? null;
        session.user.title = appToken.title ?? null;
        session.user.image = appToken.avatar ?? null;
      }

      return session;
    },
  },
});
