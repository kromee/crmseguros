import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UsersManagement } from "@/modules/users/components/users-management";
import { userService } from "@/modules/users/services/user.service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await userService.list();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Gestión de usuarios y autorizaciones (solo administrador)
        </p>
      </div>
      <UsersManagement users={users} currentUserId={session.user.id} />
    </div>
  );
}
