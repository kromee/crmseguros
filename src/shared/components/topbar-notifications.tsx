"use client";

import { Bell, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotificationsAction } from "@/modules/notifications/actions/notification.actions";
import type { NotificationItem } from "@/modules/notifications/services/notification.service";

const SEVERITY_DOT = {
  danger: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
} as const;

interface Props {
  initialBadgeCount: number;
}

export function TopbarNotifications({ initialBadgeCount }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [badgeCount, setBadgeCount] = useState(initialBadgeCount);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getNotificationsAction();
      if (result.ok) {
        setBadgeCount(result.data.badgeCount);
        setItems(result.data.items);
        setLoaded(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !loaded) void loadNotifications();
    if (next && loaded) void loadNotifications();
  }

  const badgeLabel = badgeCount > 9 ? "9+" : String(badgeCount);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className="relative p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors outline-none"
        aria-label="Notificaciones"
      >
        <Bell className="w-4 h-4 text-theme-muted" />
        {badgeCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {badgeLabel}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(100vw-2rem,22rem)] p-0 bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xl"
      >
        <div className="px-4 py-3 border-b border-theme-subtle">
          <p className="text-sm font-semibold text-theme-primary">Notificaciones</p>
          <p className="text-xs text-theme-muted mt-0.5">
            Pólizas, pagos, prospectos y recordatorios
          </p>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading && !loaded ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-theme-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando...
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="w-8 h-8 text-theme-muted/40 mx-auto mb-2" />
              <p className="text-sm text-theme-secondary font-medium">Todo al día</p>
              <p className="text-xs text-theme-muted mt-1">No hay alertas urgentes por ahora.</p>
            </div>
          ) : (
            <ul className="py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${SEVERITY_DOT[item.severity]}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-theme-primary leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-theme-muted mt-0.5 line-clamp-2">{item.detail}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs">
          <Link
            href="/reminders"
            onClick={() => setOpen(false)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Recordatorios
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver alertas
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
