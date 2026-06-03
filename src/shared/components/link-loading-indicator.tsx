"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

/** Indicador compacto para acciones/enlaces con useLinkStatus (Next.js 15+) */
export function LinkLoadingIndicator({ label = "Cargando" }: { label?: string }) {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-theme-muted">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      {label}
    </span>
  );
}
