import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

export type AppJwt = JWT & {
  id: string;
  role: "ADMIN" | "USER";
  title?: string | null;
  avatar?: string | null;
};

/**
 * Configuración compatible con Edge (middleware).
 * NO importar Prisma ni servicios de base de datos aquí.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      const appToken = token as AppJwt;
      if (user?.id) {
        appToken.id = user.id;
        appToken.role = user.role;
        appToken.title = user.title ?? null;
        appToken.avatar = user.image ?? null;
      }
      return appToken;
    },
    async session({ session, token }) {
      const appToken = token as AppJwt;
      if (session.user && appToken.id && appToken.role) {
        session.user.id = appToken.id;
        session.user.role = appToken.role;
        session.user.title = appToken.title ?? null;
        session.user.image = appToken.avatar ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
