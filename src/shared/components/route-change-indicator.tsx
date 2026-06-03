"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Barra fina en la parte superior al cambiar de ruta (feedback inmediato) */
export function RouteChangeIndicator() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const timer = window.setTimeout(() => setActive(false), 700);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!active) return null;

  return <div className="crm-route-progress" aria-hidden />;
}
