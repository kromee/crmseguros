"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  TrendingUp,
  Settings,
  HelpCircle,
  Shield,
  DollarSign,
  Bell,
  BarChart3,
} from "lucide-react";
import { useTenantBranding, useTenantDisplaySlogan } from "@/shared/providers/tenant-branding-provider";

const navItems = [
  { href: "/dashboard", label: "Panel de Control", icon: LayoutDashboard },
  { href: "/contacts", label: "Contactos", icon: Users },
  { href: "/services", label: "Servicios", icon: Briefcase },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/reminders", label: "Recordatorios", icon: Bell },
  { href: "/pipeline", label: "Pipeline", icon: TrendingUp },
  { href: "/finances", label: "Finanzas", icon: DollarSign },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

const bottomItems = [
  { href: "/settings", label: "Configuración", icon: Settings },
  { href: "/support", label: "Soporte", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { name, logo } = useTenantBranding();
  const tagline = useTenantDisplaySlogan();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="crm-sidebar">
      <div className="crm-sidebar-logo">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/files/${logo}`} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Shield className="w-4 h-4 text-white" />
            )}
          </div>
          <h1 className="truncate">{name}</h1>
        </div>
        <span className="line-clamp-2">{tagline}</span>
      </div>

      <nav className="flex-1 py-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`crm-nav-item ${isActive(href) ? "active" : ""}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="pb-4 border-t border-white/5 pt-2">
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`crm-nav-item ${isActive(href) ? "active" : ""}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
