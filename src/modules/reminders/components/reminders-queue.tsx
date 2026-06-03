"use client";

import { Bell, Calendar, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EVENT_TYPES } from "@/core/constants";
import { formatDateTime } from "@/core/utils/format";
import { completeReminderAction } from "../actions/reminder.actions";
import type { ReminderItem } from "../services/reminder.service";

type SerializedReminder = Omit<ReminderItem, "startDate" | "endDate" | "reminderAt"> & {
  startDate: string;
  endDate: string;
  reminderAt: string;
};

const STATUS_STYLES = {
  overdue: {
    label: "Vencido",
    badge: "bg-red-100 text-red-700",
    border: "border-red-200 bg-red-50/50",
  },
  due: {
    label: "Recordar ahora",
    badge: "bg-amber-100 text-amber-800",
    border: "border-amber-200 bg-amber-50/50",
  },
  upcoming: {
    label: "Próximo",
    badge: "bg-blue-100 text-blue-700",
    border: "border-blue-200 bg-blue-50/50",
  },
};

function eventTypeLabel(type: string) {
  return EVENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

function calendarEventHref(item: SerializedReminder) {
  const start = new Date(item.startDate);
  const params = new URLSearchParams({
    year: String(start.getFullYear()),
    month: String(start.getMonth()),
    event: item.id,
  });
  return `/calendar?${params.toString()}`;
}

interface Props {
  items: SerializedReminder[];
}

export function RemindersQueue({ items }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleComplete(id: string) {
    startTransition(async () => {
      const res = await completeReminderAction(id);
      if (res.ok) {
        toast.success("Marcado como completado");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="crm-card p-12 text-center">
        <Bell className="w-10 h-10 text-theme-muted/50 mx-auto mb-3" />
        <p className="text-sm text-theme-secondary font-medium">No hay recordatorios pendientes</p>
        <p className="text-xs text-theme-muted mt-1 max-w-sm mx-auto">
          Los eventos del calendario con recordatorio activo aparecerán aquí cuando llegue su hora.
        </p>
        <Link href="/calendar" className="inline-block mt-4">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Calendar className="w-4 h-4" />
            Ir al calendario
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const style = STATUS_STYLES[item.status];
        return (
          <div
            key={item.id}
            className={`crm-card p-4 border ${style.border}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                    {style.label}
                  </span>
                  <span className="text-[10px] font-medium text-theme-muted px-2 py-0.5 rounded-full bg-[var(--color-bg-card)]/80 border border-theme">
                    {eventTypeLabel(item.type)}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-theme-primary">{item.title}</h3>
                {item.contact && (
                  <Link
                    href={`/contacts/${item.contact.id}`}
                    className="text-xs text-blue-600 hover:underline mt-0.5 inline-block"
                  >
                    {item.contact.fullName} · {item.contact.code}
                  </Link>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-theme-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Evento: {formatDateTime(item.startDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    Recordatorio: {formatDateTime(item.reminderAt)}
                    {item.reminderMinutes >= 60
                      ? ` (${Math.round(item.reminderMinutes / 60)}h antes)`
                      : ` (${item.reminderMinutes} min antes)`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleComplete(item.id)}
                  className="gap-1 text-xs h-8"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completar
                </Button>
                <Link href={calendarEventHref(item)}>
                  <Button size="sm" variant="ghost" className="text-xs h-8 w-full gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Ver en calendario
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
