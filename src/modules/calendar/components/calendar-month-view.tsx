"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { EVENT_TYPES } from "@/core/constants";
import { formatCurrency, formatDate } from "@/core/utils/format";
import type { AutoEvent } from "../services/auto-events.service";
import {
  completeEventAction,
  deleteEventAction,
} from "../actions/event.actions";
import type { EventDTO } from "../utils/serialize";
import { EventFormDialog } from "./event-form-dialog";

interface ContactOption {
  id: string;
  code: string;
  fullName: string;
}

interface UserOption {
  id: string;
  name: string;
}

interface Props {
  year: number;
  month: number;
  events: EventDTO[];
  autoEvents: AutoEvent[];
  contacts: ContactOption[];
  users: UserOption[];
  currentUserId: string;
  totalEvents: number;
  /** Abre el día del evento y lo resalta (desde /reminders) */
  focusEventId?: string | null;
}

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const TYPE_STYLE: Record<string, string> = {
  RENOVACION:
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/25",
  COBRO_PAGO:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25",
  SEGUIMIENTO:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
  LLAMADA:
    "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/25",
  TAREA:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
};

const TYPE_ACCENT: Record<string, string> = {
  RENOVACION: "border-l-purple-500",
  COBRO_PAGO: "border-l-red-500",
  SEGUIMIENTO: "border-l-blue-500",
  LLAMADA: "border-l-indigo-500",
  TAREA: "border-l-amber-500",
};

const URGENCY_STYLE: Record<string, string> = {
  normal:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
  warning:
    "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25",
  critical:
    "bg-red-50 text-red-700 border-red-300 font-bold dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30",
  expired:
    "bg-red-100 text-red-800 border-red-400 font-bold dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/35",
};

const URGENCY_ACCENT: Record<string, string> = {
  normal: "border-l-emerald-500",
  warning: "border-l-amber-500",
  critical: "border-l-red-500",
  expired: "border-l-red-600",
};

const URGENCY_DOT: Record<string, string> = {
  normal: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-red-500 animate-pulse",
  expired: "bg-red-600",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  CANCELLED: "bg-[var(--color-bg-elevated)] text-theme-secondary",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

function typeLabel(value: string) {
  return EVENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  // Días del mes anterior para llenar la primera fila
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: d, inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }
  // Rellenar la última fila
  while (cells.length % 7 !== 0) {
    const lastDate = cells[cells.length - 1].date;
    const next = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }

  return cells;
}

function groupEventsByDay(events: EventDTO[]) {
  const map = new Map<string, EventDTO[]>();
  events.forEach((e) => {
    const key = startOfDay(new Date(e.startDate)).toISOString();
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  });
  return map;
}

function groupAutoEventsByDay(events: AutoEvent[]) {
  const map = new Map<string, AutoEvent[]>();
  events.forEach((e) => {
    const key = startOfDay(new Date(e.startDate)).toISOString();
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  });
  return map;
}

export function CalendarMonthView({
  year,
  month,
  events,
  autoEvents,
  contacts,
  users,
  currentUserId,
  totalEvents,
  focusEventId = null,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [editing, setEditing] = useState<EventDTO | null>(null);
  const [dayOpen, setDayOpen] = useState<Date | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const focusedEvent = focusEventId
    ? events.find((e) => e.id === focusEventId) ?? null
    : null;

  function clearFocusFromUrl() {
    if (!params.get("event")) return;
    const next = new URLSearchParams(params.toString());
    next.delete("event");
    const q = next.toString();
    router.replace(q ? `/calendar?${q}` : "/calendar", { scroll: false });
    setHighlightedEventId(null);
  }

  function closeDayDialog() {
    setDayOpen(null);
    clearFocusFromUrl();
  }

  useEffect(() => {
    if (!focusEventId) return;
    const event = events.find((e) => e.id === focusEventId);
    if (!event) return;
    setHighlightedEventId(focusEventId);
    setDayOpen(startOfDay(new Date(event.startDate)));
  }, [focusEventId, events]);

  useEffect(() => {
    if (!highlightedEventId || !dayOpen) return;
    highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [highlightedEventId, dayOpen]);

  function openCreateForDate(date: Date) {
    setDayOpen(null);
    setCreateDate(date);
    setCreateOpen(true);
  }

  const grid = buildGrid(year, month);
  const eventsByDay = groupEventsByDay(events);
  const autoByDay = groupAutoEventsByDay(autoEvents);
  const today = startOfDay(new Date());

  function navigate(delta: number) {
    const newDate = new Date(year, month + delta, 1);
    const next = new URLSearchParams(params.toString());
    next.set("year", String(newDate.getFullYear()));
    next.set("month", String(newDate.getMonth()));
    startTransition(() => router.push(`/calendar?${next.toString()}`));
  }

  function goToday() {
    const now = new Date();
    const next = new URLSearchParams(params.toString());
    next.set("year", String(now.getFullYear()));
    next.set("month", String(now.getMonth()));
    startTransition(() => router.push(`/calendar?${next.toString()}`));
  }

  async function handleComplete(id: string) {
    const res = await completeEventAction(id);
    if (res.ok) {
      toast.success("Evento completado");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este evento?")) return;
    const res = await deleteEventAction(id);
    if (res.ok) {
      toast.success("Evento eliminado");
      setDayOpen(null);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  const dayKey = dayOpen ? startOfDay(dayOpen).toISOString() : "";
  const dayEvents = dayOpen ? (eventsByDay.get(dayKey) ?? []) : [];
  const dayAutoEvents = dayOpen ? (autoByDay.get(dayKey) ?? []) : [];

  return (
    <div className="space-y-4">
      {focusedEvent && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 rounded-lg px-4 py-2.5">
          <span className="text-sm text-blue-800 dark:text-blue-200 flex-1 min-w-0">
            Evento seleccionado:{" "}
            <strong className="truncate">{focusedEvent.title}</strong>
            <span className="text-blue-600 dark:text-blue-300/90 font-normal">
              {" "}
              · {formatDate(new Date(focusedEvent.startDate), "dd MMM yyyy HH:mm")}
            </span>
          </span>
          <button
            type="button"
            onClick={clearFocusFromUrl}
            className="text-xs font-medium text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 underline flex-shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-theme-secondary"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-theme-secondary"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Button variant="ghost" size="sm" onClick={goToday} className="text-theme-secondary">
            Hoy
          </Button>
        </div>
        <h2 className="text-lg font-bold text-theme-primary">
          {MONTHS_ES[month]} {year}
        </h2>
        <span className="text-sm text-theme-muted">
          <strong className="text-theme-secondary">{totalEvents}</strong>{" "}
          {totalEvents === 1 ? "evento" : "eventos"} este mes
        </span>
        <div className="ml-auto">
          <Button
            onClick={() => openCreateForDate(new Date())}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo evento
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="crm-card overflow-hidden">
        {/* Headers de días */}
        <div className="grid grid-cols-7 border-b border-theme bg-[var(--color-bg-input)]">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="px-2 py-2 text-xs font-semibold text-theme-muted uppercase text-center"
            >
              {w}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7">
          {grid.map((cell, i) => {
            const key = startOfDay(cell.date).toISOString();
            const dayList = eventsByDay.get(key) ?? [];
            const dayAuto = autoByDay.get(key) ?? [];
            const totalDay = dayList.length + dayAuto.length;
            const isToday = startOfDay(cell.date).getTime() === today.getTime();

            const allItems: Array<{ id: string; label: string; style: string; isAuto: boolean }> = [];

            dayAuto.forEach((a) => {
              allItems.push({
                id: a.id,
                label: a.type === "VENCIMIENTO"
                  ? `⚠ ${a.policyNumber}`
                  : `$ ${a.policyNumber}`,
                style: URGENCY_STYLE[a.urgency],
                isAuto: true,
              });
            });

            dayList.forEach((e) => {
              const time = new Date(e.startDate).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
              const completed = e.status === "COMPLETED";
              allItems.push({
                id: e.id,
                label: completed ? `✓ ${e.title}` : `${time} ${e.title}`,
                style: `${TYPE_STYLE[e.type] ?? "bg-[var(--color-bg-elevated)] text-theme-secondary border-theme"} ${completed ? "line-through opacity-50" : ""}`,
                isAuto: false,
              });
            });

            const visible = allItems.slice(0, 3);
            const extra = allItems.length - visible.length;

            const hasCritical = dayAuto.some((a) => a.urgency === "critical" || a.urgency === "expired");
            const hasFocusedEvent =
              !!highlightedEventId && dayList.some((e) => e.id === highlightedEventId);

            return (
              <button
                key={i}
                onClick={() => {
                  setHighlightedEventId(null);
                  clearFocusFromUrl();
                  setDayOpen(cell.date);
                }}
                className={`min-h-[90px] sm:min-h-[110px] p-1.5 border-r border-b border-theme-subtle text-left flex flex-col hover:bg-[var(--color-bg-hover)] transition-colors ${
                  hasFocusedEvent
                    ? "ring-2 ring-inset ring-blue-500 bg-blue-50/60 dark:bg-blue-500/10 z-[1]"
                    : hasCritical && cell.inMonth
                      ? "bg-red-50/40 dark:bg-red-500/10"
                      : cell.inMonth
                        ? "bg-[var(--color-bg-card)]"
                        : "bg-[var(--color-bg-input)]/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-semibold flex items-center justify-center ${
                      isToday
                        ? "bg-blue-600 text-white rounded-full w-5 h-5"
                        : cell.inMonth
                          ? "text-theme-secondary"
                          : "text-theme-muted"
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  <div className="flex items-center gap-1">
                    {dayAuto.length > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full ${URGENCY_DOT[dayAuto.sort((a, b) => {
                        const order = { expired: 0, critical: 1, warning: 2, normal: 3 };
                        return order[a.urgency] - order[b.urgency];
                      })[0].urgency]}`} />
                    )}
                    {totalDay > 0 && (
                      <span className="text-[9px] text-theme-muted font-medium">
                        {totalDay}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-0.5 overflow-hidden">
                  {visible.map((item) => (
                    <div
                      key={item.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${item.style} ${
                        item.id === highlightedEventId
                          ? "ring-2 ring-blue-600 font-semibold"
                          : ""
                      }`}
                    >
                      {item.label}
                    </div>
                  ))}
                  {extra > 0 && (
                    <p className="text-[10px] text-theme-muted font-semibold">
                      + {extra} más
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-theme-muted font-semibold uppercase text-[10px]">Eventos:</span>
        {EVENT_TYPES.map((t) => (
          <span
            key={t.value}
            className={`px-2 py-0.5 rounded-full border ${
              TYPE_STYLE[t.value] ?? "bg-[var(--color-bg-elevated)]"
            }`}
          >
            {t.label}
          </span>
        ))}
        <span className="text-theme-muted/50 mx-1">|</span>
        <span className="text-theme-muted font-semibold uppercase text-[10px]">Automáticos:</span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> +30 días
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> 8-30 días
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-300 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> ≤7 días
        </span>
      </div>

      {/* Dialog del día */}
      <Dialog open={!!dayOpen} onOpenChange={(o) => !o && closeDayDialog()}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-theme-primary">
              {dayOpen
                ? formatDate(dayOpen, "EEEE dd 'de' MMMM yyyy")
                : ""}
            </h3>
            <Button
              size="sm"
              onClick={() => dayOpen && openCreateForDate(dayOpen)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1 h-8 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar
            </Button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto px-6 pb-5">
            {/* Eventos automáticos */}
            {dayAutoEvents.map((a) => (
              <div
                key={a.id}
                className={`p-3 rounded-lg border border-theme bg-[var(--color-bg-card)] border-l-4 ${
                  URGENCY_ACCENT[a.urgency] ?? "border-l-emerald-500"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {a.urgency === "critical" || a.urgency === "expired" ? (
                      <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                    ) : a.urgency === "warning" ? (
                      <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                    ) : (
                      <Shield className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                    )}
                    <p className="text-sm font-semibold text-theme-primary">{a.title}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      a.urgency === "expired"
                        ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                        : a.urgency === "critical"
                          ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                          : a.urgency === "warning"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    }`}
                  >
                    {a.daysUntil < 0
                      ? `Venció hace ${Math.abs(a.daysUntil)}d`
                      : a.daysUntil === 0
                        ? "Vence hoy"
                        : `${a.daysUntil}d restantes`}
                  </span>
                </div>
                <div className="text-xs space-y-0.5 mt-1.5 text-theme-secondary">
                  <p>
                    <span className="text-theme-muted">Cliente:</span>{" "}
                    <Link
                      href={`/contacts/${a.contactId}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {a.contactName}
                    </Link>
                  </p>
                  <p>
                    <span className="text-theme-muted">Póliza:</span>{" "}
                    <span className="font-mono text-theme-primary">{a.policyNumber}</span>
                    {a.insurer && <span className="text-theme-muted"> · {a.insurer}</span>}
                  </p>
                  <p>
                    <span className="text-theme-muted">Prima:</span>{" "}
                    <span className="font-semibold text-theme-primary">{formatCurrency(a.premium)}</span>
                  </p>
                </div>
              </div>
            ))}

            {dayEvents.length === 0 && dayAutoEvents.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-theme-muted mb-3">
                  Sin eventos en este día.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => dayOpen && openCreateForDate(dayOpen)}
                  className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-500/30 dark:hover:bg-blue-500/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear evento aquí
                </Button>
              </div>
            ) : (
              dayEvents.map((e) => (
                <div
                  key={e.id}
                  ref={e.id === highlightedEventId ? highlightRef : undefined}
                  className={`p-3 rounded-lg border border-theme bg-[var(--color-bg-card)] border-l-4 ${
                    TYPE_ACCENT[e.type] ?? "border-l-[var(--color-border)]"
                  } ${e.status === "COMPLETED" ? "opacity-60" : ""} ${
                    e.id === highlightedEventId
                      ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[var(--color-bg-card)] shadow-md"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {e.status === "COMPLETED" && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      )}
                      <p
                        className={`text-sm font-semibold text-theme-primary ${e.status === "COMPLETED" ? "line-through" : ""}`}
                      >
                        {e.title}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${
                        STATUS_BADGE[e.status] ?? "bg-[var(--color-bg-elevated)] text-theme-secondary"
                      }`}
                    >
                      {e.status === "COMPLETED" && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {STATUS_LABEL[e.status] ?? e.status}
                    </span>
                  </div>
                  <p className="text-xs text-theme-secondary">
                    {new Date(e.startDate).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    →{" "}
                    {new Date(e.endDate).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {typeLabel(e.type)}
                  </p>
                  {e.contact && (
                    <p className="text-xs text-theme-muted mt-1">
                      Contacto:{" "}
                      <Link
                        href={`/contacts/${e.contact.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {e.contact.fullName}
                      </Link>
                    </p>
                  )}
                  {e.description && (
                    <p className="text-xs text-theme-secondary mt-2 whitespace-pre-wrap">
                      {e.description}
                    </p>
                  )}
                  {e.status === "PENDING" && (
                    <div className="flex gap-1.5 mt-3">
                      <button
                        onClick={() => handleComplete(e.id)}
                        className="text-xs px-2 py-1 rounded border border-emerald-200 bg-[var(--color-bg-elevated)] text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Completar
                      </button>
                      <button
                        onClick={() => {
                          setEditing(e);
                          closeDayDialog();
                        }}
                        className="text-xs px-2 py-1 rounded border border-theme bg-[var(--color-bg-elevated)] text-theme-secondary hover:bg-[var(--color-bg-hover)]"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-xs px-2 py-1 rounded border border-red-200 bg-[var(--color-bg-elevated)] text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog crear/editar */}
      <EventFormDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateDate(null);
        }}
        mode="create"
        contacts={contacts}
        users={users}
        currentUserId={currentUserId}
        defaultValues={
          createDate
            ? {
                startDate: new Date(createDate.getFullYear(), createDate.getMonth(), createDate.getDate(), 0, 0, 0),
                endDate: new Date(createDate.getFullYear(), createDate.getMonth(), createDate.getDate(), 23, 59, 0),
              }
            : undefined
        }
      />

      {editing && (
        <EventFormDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          mode="edit"
          eventId={editing.id}
          contacts={contacts}
          users={users}
          currentUserId={currentUserId}
          defaultValues={{
            title: editing.title,
            type: editing.type as never,
            contactId: editing.contactId,
            userId: editing.userId,
            startDate: new Date(editing.startDate),
            endDate: new Date(editing.endDate),
            description: editing.description ?? "",
            priority: editing.priority as never,
            notifyClient: editing.notifyClient,
            notifyAgent: editing.notifyAgent,
            reminderMinutes: editing.reminderMinutes,
            status: editing.status as never,
          }}
        />
      )}
    </div>
  );
}
