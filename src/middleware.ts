import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const publicPaths = ["/login", "/activar", "/cuenta-bloqueada"];

const crmPathPattern =
  /^\/(dashboard|contacts|services|calendar|pipeline|finances|reminders|settings)(\/|$)/;

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthApi = pathname.startsWith("/api/auth");
  const isPlatform = pathname.startsWith("/platform");

  if (isAuthApi) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isPlatform && !isSuperAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (isLoggedIn && isSuperAdmin && crmPathPattern.test(pathname)) {
    return NextResponse.redirect(new URL("/platform", req.nextUrl.origin));
  }

  if (isLoggedIn && pathname === "/login") {
    const target = isSuperAdmin ? "/platform" : "/dashboard";
    return NextResponse.redirect(new URL(target, req.nextUrl.origin));
  }

  if (isLoggedIn && pathname === "/activar") {
    const target = isSuperAdmin ? "/platform" : "/dashboard";
    return NextResponse.redirect(new URL(target, req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contacts/:path*",
    "/services/:path*",
    "/calendar/:path*",
    "/pipeline/:path*",
    "/finances/:path*",
    "/reminders/:path*",
    "/settings/:path*",
    "/platform/:path*",
    "/login",
    "/activar",
    "/cuenta-bloqueada",
    "/",
  ],
};
