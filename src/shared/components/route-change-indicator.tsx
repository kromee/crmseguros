"use client";

import { usePathname } from "next/navigation";

/** Barra fina en la parte superior al cambiar de ruta (feedback inmediato) */
export function RouteChangeIndicator() {
  const pathname = usePathname();

  return <div key={pathname} className="crm-route-progress" aria-hidden />;
}
