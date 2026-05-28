import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/shared/components/Sidebar";
import { Topbar } from "@/shared/components/Topbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/shared/providers/session-provider";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AuthSessionProvider>
      <div className="crm-layout">
        <Sidebar />
        <div className="crm-main">
          <Topbar user={session.user} />
          <main className="crm-content">{children}</main>
          <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-100">
            <span className="font-semibold text-slate-500">Seguros Mexa</span> © 2024 ·{" "}
            Innovando tu seguridad, protegiendo tu mañana.
          </footer>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    </AuthSessionProvider>
  );
}
