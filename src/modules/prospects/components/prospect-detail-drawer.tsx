"use client";

import {
  ArrowRightCircle,
  Bell,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PRIORITIES } from "@/core/constants";
import {
  formatCurrency,
  getInitials,
  timeAgo,
} from "@/core/utils/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NewActivityButton } from "@/modules/activities/components/new-activity-button";
import {
  changeProspectStageAction,
  convertProspectToClientAction,
  deleteProspectAction,
  markProspectLostAction,
} from "../actions/prospect.actions";
import type { ProspectDTO } from "../utils/serialize";

interface ActivityItem {
  id: string;
  type: string;
  summary: string;
  result: string;
  createdAt: string;
  performer: { id: string; name: string } | null;
}

interface NextEventInfo {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  reminderMinutes: number;
  description: string | null;
  status: string;
}

interface Props {
  prospect: ProspectDTO | null;
  recentActivities?: ActivityItem[];
  nextEvent?: NextEventInfo | null;
  onClose: () => void;
}

const ACTIVITY_ICON: Record<string, typeof Phone> = {
  LLAMADA: Phone,
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  NOTA: FileText,
  VISITA: User,
  DOCUMENTO: FileText,
};

const ACTIVITY_COLOR: Record<string, string> = {
  LLAMADA: "text-blue-600 bg-blue-50",
  EMAIL: "text-purple-600 bg-purple-50",
  WHATSAPP: "text-green-600 bg-green-50",
  NOTA: "text-theme-secondary bg-[var(--color-bg-input)]",
  VISITA: "text-amber-600 bg-amber-50",
  DOCUMENTO: "text-indigo-600 bg-indigo-50",
};

const STAGES = [
  { value: "CONTACTO_INICIAL", label: "Contacto inicial" },
  { value: "SEGUIMIENTO", label: "Seguimiento" },
  { value: "COTIZACION", label: "Cotización" },
  { value: "CIERRE", label: "Cierre" },
];

const NEXT_ACTION_ICONS: Record<
  string,
  { Icon: typeof Phone; label: string; bg: string; text: string }
> = {
  LLAMADA: {
    Icon: Phone,
    label: "Llamada",
    bg: "bg-blue-500/20",
    text: "text-blue-100",
  },
  CITA: {
    Icon: CalendarDays,
    label: "Cita",
    bg: "bg-emerald-500/20",
    text: "text-emerald-100",
  },
  EMAIL: {
    Icon: Mail,
    label: "Email",
    bg: "bg-purple-500/20",
    text: "text-purple-100",
  },
  OTRO: {
    Icon: MapPin,
    label: "Otro",
    bg: "bg-amber-500/20",
    text: "text-amber-100",
  },
};

function formatReminder(min: number) {
  if (min < 60) return `${min} min antes`;
  if (min < 1440) {
    const h = Math.round(min / 60);
    return `${h} hora${h === 1 ? "" : "s"} antes`;
  }
  const d = Math.round(min / 1440);
  return `${d} día${d === 1 ? "" : "s"} antes`;
}

function formatDateTimeFull(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function priorityLabel(value: string) {
  return PRIORITIES.find((p) => p.value === value)?.label ?? value;
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activo",
  WON: "Convertido",
  LOST: "Perdido",
};

export function ProspectDetailDrawer({
  prospect,
  recentActivities = [],
  nextEvent = null,
  onClose,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmModal, setConfirmModal] = useState<
    "convert" | "lost" | "delete" | null
  >(null);

  if (!prospect) {
    return <Sheet open={false} onOpenChange={() => {}} />;
  }

  function handleStage(stage: string) {
    if (!prospect) return;
    startTransition(async () => {
      const res = await changeProspectStageAction(prospect.id, stage);
      if (res.ok) {
        toast.success("Etapa actualizada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function executeConvert() {
    if (!prospect) return;
    startTransition(async () => {
      const res = await convertProspectToClientAction(prospect.id);
      setConfirmModal(null);
      if (res.ok) {
        toast.success("¡Prospecto convertido a cliente exitosamente!");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function executeLost() {
    if (!prospect) return;
    startTransition(async () => {
      const res = await markProspectLostAction(prospect.id);
      setConfirmModal(null);
      if (res.ok) {
        toast.success("Marcado como perdido");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function executeDelete() {
    if (!prospect) return;
    startTransition(async () => {
      const res = await deleteProspectAction(prospect.id);
      setConfirmModal(null);
      if (res.ok) {
        toast.success("Prospecto eliminado");
        onClose();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const isClosed = prospect.status !== "ACTIVE";

  return (
    <Sheet open={!!prospect} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className="w-full sm:max-w-md p-0 overflow-y-auto bg-[var(--color-bg-card)]"
        showCloseButton={false}
      >
        {/* Header con gradiente */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-5 pt-5 pb-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-white/80 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <SheetHeader className="relative p-0 border-0">
            <div className="flex items-start gap-3">
              <Avatar className="w-14 h-14 flex-shrink-0 ring-2 ring-white/20">
                <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-lg font-bold">
                  {getInitials(prospect.contact.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg font-bold text-white">
                  {prospect.contact.fullName}
                </SheetTitle>
                <SheetDescription className="text-xs text-blue-200 font-mono mt-0.5">
                  {prospect.code} · {prospect.contact.code}
                </SheetDescription>
                <div className="flex gap-1.5 mt-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white`}
                  >
                    {STATUS_LABEL[prospect.status] ?? prospect.status}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200">
                    {priorityLabel(prospect.priority)}
                  </span>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Datos de contacto inline */}
          <div className="relative flex items-center gap-4 mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-blue-100">
              <Phone className="w-3 h-3 text-blue-300" />
              {prospect.contact.phone}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-100 truncate">
              <Mail className="w-3 h-3 text-blue-300" />
              {prospect.contact.email ?? "Sin correo"}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* KPIs del prospecto */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[var(--color-bg-input)] rounded-xl p-3 text-center border border-theme-subtle">
              <p className="text-lg font-bold text-theme-primary">
                {prospect.probability}%
              </p>
              <p className="text-[10px] text-theme-muted font-medium">Probabilidad</p>
            </div>
            <div className="bg-[var(--color-bg-input)] rounded-xl p-3 text-center border border-theme-subtle">
              <p className="text-lg font-bold text-theme-primary">
                {prospect.estimatedValue
                  ? formatCurrency(prospect.estimatedValue)
                  : "—"}
              </p>
              <p className="text-[10px] text-theme-muted font-medium">Valor est.</p>
            </div>
            <div className="bg-[var(--color-bg-input)] rounded-xl p-3 text-center border border-theme-subtle">
              <p className="text-base text-amber-500 leading-tight mt-0.5">
                {"★".repeat(prospect.rating)}
                <span className="text-theme-muted/40">
                  {"★".repeat(5 - prospect.rating)}
                </span>
              </p>
              <p className="text-[10px] text-theme-muted font-medium mt-0.5">Calificación</p>
            </div>
          </div>

          {/* Info del prospecto */}
          <div className="rounded-xl border border-theme-subtle divide-y divide-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-theme-muted">Servicio</span>
              <span className="text-xs font-semibold text-theme-primary">
                {prospect.serviceOfInterest ?? "Sin definir"}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-theme-muted">Asignado a</span>
              <span className="text-xs font-semibold text-theme-primary">
                {prospect.assignedUser?.name ?? "Sin asignar"}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-theme-muted">Creado</span>
              <span className="text-xs font-semibold text-theme-primary">
                {new Date(prospect.createdAt).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Próxima acción */}
          <NextActionCard nextEvent={nextEvent} contactId={prospect.contactId} />

          {prospect.notes && (
            <div className="rounded-xl bg-[var(--color-bg-input)] border border-theme-subtle p-3.5 text-xs text-theme-secondary whitespace-pre-wrap">
              <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wide mb-1.5">
                Notas
              </p>
              {prospect.notes}
            </div>
          )}

          {/* Bitácora reciente */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-semibold text-theme-muted uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Bitácora reciente
              </p>
              <NewActivityButton
                contactId={prospect.contactId}
                variant="outline"
                label="Agregar"
              />
            </div>
            {recentActivities.length === 0 ? (
              <p className="text-xs text-theme-muted py-4 text-center bg-[var(--color-bg-input)] rounded-xl border border-dashed border-theme">
                Sin entradas todavía
              </p>
            ) : (
              <div className="space-y-1.5">
                {recentActivities.map((act) => {
                  const Icon = ACTIVITY_ICON[act.type] ?? FileText;
                  const colorClass = ACTIVITY_COLOR[act.type] ?? ACTIVITY_COLOR.NOTA;
                  return (
                    <div
                      key={act.id}
                      className="flex gap-2.5 p-2.5 rounded-xl bg-[var(--color-bg-input)] border border-theme-subtle hover:border-theme transition-colors"
                    >
                      <div className={`p-1.5 rounded-lg ${colorClass} h-fit`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-theme-secondary line-clamp-2">
                          {act.summary}
                        </p>
                        <p className="text-[10px] text-theme-muted mt-0.5">
                          {timeAgo(act.createdAt)} · {act.performer?.name ?? "Sistema"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Etapas */}
          {!isClosed && (
            <div>
              <p className="text-xs font-semibold text-theme-muted uppercase tracking-wide mb-2.5">
                Mover a etapa
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {STAGES.map((s) => {
                  const active = prospect.stage === s.value;
                  return (
                    <button
                      key={s.value}
                      disabled={active || isPending}
                      onClick={() => handleStage(s.value)}
                      className={`text-[11px] font-semibold py-2 px-1 rounded-lg border transition-all ${
                        active
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm cursor-default"
                          : "bg-[var(--color-bg-card)] border-theme text-theme-secondary hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acciones principales */}
          {!isClosed && (
            <div className="space-y-2 pt-3 border-t border-theme-subtle">
              <Button
                onClick={() => setConfirmModal("convert")}
                disabled={isPending}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-white gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Convertir a cliente
              </Button>
              <Button
                onClick={() => setConfirmModal("lost")}
                disabled={isPending}
                variant="outline"
                className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                Marcar como perdido
              </Button>
            </div>
          )}

          <div className="pt-3 border-t border-theme-subtle space-y-2">
            <Link href={`/contacts/${prospect.contactId}`} className="block">
              <Button variant="outline" className="w-full gap-2 text-sm border-theme hover:border-blue-300">
                <ExternalLink className="w-3.5 h-3.5" />
                Ver ficha de contacto
              </Button>
            </Link>
            <Link
              href={`/contacts/${prospect.contactId}/interactions`}
              className="block"
            >
              <Button variant="outline" className="w-full gap-2 text-sm border-theme hover:border-blue-300">
                <ArrowRightCircle className="w-3.5 h-3.5" />
                Ver bitácora completa
              </Button>
            </Link>
            <Button
              onClick={() => setConfirmModal("delete")}
              variant="ghost"
              disabled={isPending}
              className="w-full text-red-500 hover:bg-red-50 gap-2 text-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar prospecto
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Modal: Convertir a cliente */}
      <Dialog
        open={confirmModal === "convert"}
        onOpenChange={(o) => !o && setConfirmModal(null)}
      >
        <DialogContent
          className="sm:max-w-[440px] p-0 gap-0 overflow-hidden"
          showCloseButton={false}
        >
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-6 text-center">
            <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Convertir a cliente</h2>
            <p className="text-sm text-white/70 mt-1">
              Esta acción cambiará el estatus del prospecto
            </p>
          </div>

          <div className="px-6 py-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarFallback className="bg-emerald-600 text-white text-sm font-bold">
                    {prospect ? getInitials(prospect.contact.fullName) : ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-theme-primary">
                    {prospect?.contact.fullName}
                  </p>
                  <p className="text-xs text-theme-muted">
                    {prospect?.contact.code} · {prospect?.serviceOfInterest ?? "Sin servicio"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-theme-secondary">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>El contacto pasará de <strong>Prospecto</strong> a <strong>Cliente</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Se registrará la conversión en la bitácora</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Podrás agregar pólizas y servicios al contacto</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-theme-subtle bg-[var(--color-bg-input)]/80 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setConfirmModal(null)}
              className="text-theme-muted"
            >
              Cancelar
            </Button>
            <Button
              onClick={executeConvert}
              disabled={isPending}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-white shadow-sm min-w-[160px]"
            >
              {isPending ? "Convirtiendo..." : "Sí, convertir a cliente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Marcar como perdido */}
      <Dialog
        open={confirmModal === "lost"}
        onOpenChange={(o) => !o && setConfirmModal(null)}
      >
        <DialogContent
          className="sm:max-w-[420px] p-0 gap-0 overflow-hidden"
          showCloseButton={false}
        >
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-6 text-center">
            <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
              <XCircle className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Marcar como perdido</h2>
            <p className="text-sm text-white/70 mt-1">
              {prospect?.contact.fullName}
            </p>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-theme-secondary">
              El prospecto se marcará como <strong>perdido</strong> y saldrá del pipeline activo. 
              El contacto seguirá disponible en el directorio.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-theme-subtle bg-[var(--color-bg-input)]/80 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setConfirmModal(null)}
              className="text-theme-muted"
            >
              Cancelar
            </Button>
            <Button
              onClick={executeLost}
              disabled={isPending}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white shadow-sm"
            >
              {isPending ? "Procesando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Eliminar prospecto */}
      <Dialog
        open={confirmModal === "delete"}
        onOpenChange={(o) => !o && setConfirmModal(null)}
      >
        <DialogContent
          className="sm:max-w-[420px] p-0 gap-0 overflow-hidden"
          showCloseButton={false}
        >
          <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-6 text-center">
            <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
              <Trash2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Eliminar prospecto</h2>
            <p className="text-sm text-white/70 mt-1">
              {prospect?.contact.fullName}
            </p>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-theme-secondary">
              Esta acción es <strong>permanente</strong> y no se puede deshacer.
              Se eliminará el prospecto del pipeline pero el contacto se mantendrá.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-theme-subtle bg-[var(--color-bg-input)]/80 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setConfirmModal(null)}
              className="text-theme-muted"
            >
              Cancelar
            </Button>
            <Button
              onClick={executeDelete}
              disabled={isPending}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 text-white shadow-sm"
            >
              {isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}

function NextActionCard({
  nextEvent,
  contactId,
}: {
  nextEvent: NextEventInfo | null;
  contactId: string;
}) {
  if (!nextEvent) {
    return (
      <div className="rounded-xl border border-dashed border-theme p-4 text-center">
        <Sparkles className="w-5 h-5 text-theme-muted/50 mx-auto mb-1.5" />
        <p className="text-xs text-theme-muted font-medium">Sin próxima acción programada</p>
        <p className="text-[11px] text-theme-muted mt-0.5 mb-3">
          Programa un evento en el calendario para dar seguimiento a este prospecto.
        </p>
        <Link
          href={`/calendar?contactId=${contactId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Ver eventos del contacto
        </Link>
      </div>
    );
  }

  const iconCfg = NEXT_ACTION_ICONS[nextEvent.type] ?? NEXT_ACTION_ICONS.OTRO;
  const Icon = iconCfg.Icon;
  const dateObj = new Date(nextEvent.startDate);
  const isPast = dateObj < new Date();
  const calendarHref = `/calendar?year=${dateObj.getFullYear()}&month=${dateObj.getMonth()}&contactId=${contactId}`;

  return (
    <div className={`rounded-xl text-white p-4 shadow-sm ${
      isPast
        ? "bg-gradient-to-br from-red-600 to-red-700"
        : "bg-gradient-to-br from-blue-700 to-blue-800"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          Próxima acción
        </h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          isPast
            ? "bg-white/20 text-white"
            : "bg-emerald-500/20 text-emerald-100"
        }`}>
          {isPast ? "Atrasada" : "Programada"}
        </span>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${isPast ? "bg-white/15" : iconCfg.bg}`}>
          <Icon className={`w-4 h-4 ${isPast ? "text-white" : iconCfg.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{nextEvent.title}</p>
          <p className="text-xs text-white/70 mt-0.5">{iconCfg.label}</p>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-white/10 pt-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-3.5 h-3.5 text-white/60" />
          <span className="text-white font-medium">
            {formatDateTimeFull(nextEvent.startDate)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Bell className="w-3.5 h-3.5 text-white/60" />
          <span className="text-white/80">
            Recordatorio {formatReminder(nextEvent.reminderMinutes)}
          </span>
        </div>
      </div>

      {nextEvent.description && (
        <p className="text-xs text-white/70 mt-3 pt-3 border-t border-white/10 line-clamp-2 whitespace-pre-wrap">
          {nextEvent.description}
        </p>
      )}

      <Link
        href={calendarHref}
        className="flex items-center justify-center gap-1.5 mt-4 text-xs bg-white/10 hover:bg-white/20 transition-colors text-white py-2 rounded-md font-medium"
      >
        <CalendarDays className="w-3.5 h-3.5" />
        Ver en calendario
      </Link>
    </div>
  );
}
