"use client";

import { LogOut, Moon, Sun, User } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isTenantAdmin } from "@/core/tenant/roles";
import { getInitials } from "@/core/utils/format";
import { useProfileDialog } from "@/shared/providers/profile-dialog-provider";
import { TopbarNotifications } from "@/shared/components/topbar-notifications";

function avatarSrc(image: string | null | undefined) {
  if (!image) return undefined;
  if (image.startsWith("/") || image.startsWith("http")) return image;
  return `/api/files/${image}`;
}

interface TopbarProps {
  user: Session["user"];
  notificationBadgeCount?: number;
}

export function Topbar({ user, notificationBadgeCount = 0 }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const { openProfile } = useProfileDialog();
  const displayName = user.name ?? "Usuario";
  const displayTitle = user.title ?? (isTenantAdmin(user.role) ? "Administrador" : "Agente");
  const isDark = theme === "dark";
  const photoSrc = avatarSrc(user.image);

  return (
    <header className="crm-topbar">
      <div className="flex items-center gap-2 ml-auto">
        {user.tenantId ? (
          <TopbarNotifications initialBadgeCount={notificationBadgeCount} />
        ) : null}

        <button
          type="button"
          className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
          aria-label="Cambiar tema"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-theme-muted" />
          ) : (
            <Moon className="w-4 h-4 text-theme-muted" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-2 border-l border-theme outline-none cursor-pointer">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-theme-primary">{displayName}</p>
              <p className="text-xs text-theme-muted">{displayTitle}</p>
            </div>
            <Avatar className="w-8 h-8">
              {photoSrc && <AvatarImage src={photoSrc} alt={displayName} />}
              <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-xl"
          >
            <div className="px-2 py-1.5">
              <p className="font-medium text-sm text-theme-primary">{displayName}</p>
              <p className="text-xs text-theme-muted font-normal">{user.email}</p>
            </div>
            {user.tenantId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={openProfile}>
                  <User className="w-4 h-4 mr-2" />
                  Mi perfil
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
