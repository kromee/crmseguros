"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function PlatformHeaderActions({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-theme-muted hidden sm:inline">{email}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-theme-secondary"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="w-4 h-4 mr-1.5" />
        Cerrar sesión
      </Button>
    </div>
  );
}
