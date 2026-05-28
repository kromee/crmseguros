"use client";

import { Bell, LogOut, Moon, Sun } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/core/utils/format";

interface TopbarProps {
  user: Session["user"];
  placeholder?: string;
}

export function Topbar({ user, placeholder = "Buscar datos..." }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const displayName = user.name ?? "Usuario";
  const displayTitle = user.title ?? (user.role === "ADMIN" ? "Administrador" : "Agente");
  const isDark = theme === "dark";

  return (
    <header className="crm-topbar">
      <div className="relative flex-1 max-w-md">
        <Input
          placeholder={placeholder}
          className="h-9 bg-slate-50 border-slate-200 text-sm"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button
          type="button"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Cambiar tema"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-slate-500" />
          ) : (
            <Moon className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-2 border-l border-slate-200 outline-none cursor-pointer">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-800">{displayName}</p>
              <p className="text-xs text-slate-400">{displayTitle}</p>
            </div>
            <Avatar className="w-8 h-8">
              {user.image && <AvatarImage src={user.image} alt={displayName} />}
              <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white text-slate-800 border border-slate-200 shadow-xl"
          >
            <div className="px-2 py-1.5 bg-white">
              <p className="font-medium text-sm text-slate-800">{displayName}</p>
              <p className="text-xs text-slate-500 font-normal">{user.email}</p>
            </div>
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
