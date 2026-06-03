"use client";

import { useState } from "react";
import type { UserRole } from "@prisma/client";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPasswordResetDialog } from "@/modules/users/components/admin-password-reset-dialog";

type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export function PlatformTenantUsersTable({ users }: { users: TenantUser[] }) {
  const [resetUser, setResetUser] = useState<TenantUser | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-bg-elevated)] text-left text-theme-muted">
            <tr>
              <th className="px-6 py-3 font-medium">Nombre</th>
              <th className="px-6 py-3 font-medium">Correo</th>
              <th className="px-6 py-3 font-medium">Rol</th>
              <th className="px-6 py-3 font-medium">Estado</th>
              <th className="px-6 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-3 font-medium text-theme-primary">{user.name}</td>
                <td className="px-6 py-3">{user.email}</td>
                <td className="px-6 py-3">{user.role}</td>
                <td className="px-6 py-3">
                  {user.isActive ? (
                    <span className="text-green-700 dark:text-green-400">Activo</span>
                  ) : (
                    <span className="text-theme-muted">Inactivo</span>
                  )}
                </td>
                <td className="px-6 py-3 text-right">
                  {user.role === "TENANT_ADMIN" && user.isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setResetUser(user)}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Contraseña
                    </Button>
                  ) : (
                    <span className="text-xs text-theme-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetUser && (
        <AdminPasswordResetDialog
          userId={resetUser.id}
          userName={resetUser.name}
          userEmail={resetUser.email}
          open={!!resetUser}
          onOpenChange={(open) => !open && setResetUser(null)}
        />
      )}
    </>
  );
}
