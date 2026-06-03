import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isSuperAdmin } from "@/core/tenant/roles";
import { PlatformHeaderActions } from "./_components/platform-header-actions";
import { AuthSessionProvider } from "@/shared/providers/session-provider";

const nav = [
  { href: "/platform", label: "Resumen" },
  { href: "/platform/tenants", label: "Agencias" },
  { href: "/platform/licenses", label: "Licencias" },
];

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/platform");
  }
  if (!isSuperAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <AuthSessionProvider>
      <div className="min-h-screen bg-[var(--color-bg-page)]">
      <header className="border-b bg-[var(--color-bg-card)]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-theme-primary">CRM · Plataforma SaaS</span>
            <nav className="flex gap-4 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-theme-secondary hover:text-blue-600"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <PlatformHeaderActions email={session.user.email ?? ""} />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </div>
    </AuthSessionProvider>
  );
}
