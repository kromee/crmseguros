"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bell,
  CalendarDays,
  FileText,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_TYPES, PRIORITIES } from "@/core/constants";
import {
  createEventAction,
  updateEventAction,
} from "../actions/event.actions";
import {
  eventBaseSchema,
  type CreateEventInput,
} from "../schemas/event.schema";

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  eventId?: string;
  defaultValues?: Partial<CreateEventInput>;
  contacts: ContactOption[];
  users: UserOption[];
  currentUserId: string;
}

const EVENT_STATUS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "COMPLETED", label: "Completado" },
  { value: "CANCELLED", label: "Cancelado" },
];

function toDateTimeLocal(d: Date | string | undefined | null): string {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const tz = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - tz).toISOString().slice(0, 16);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-500 mt-1 font-medium">{message}</p>;
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 pb-2">
      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-100">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {children}
      </span>
    </div>
  );
}

export function EventFormDialog({
  open,
  onOpenChange,
  mode,
  eventId,
  defaultValues,
  contacts,
  users,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateEventInput>({
    resolver: zodResolver(eventBaseSchema) as never,
    defaultValues: {
      title: "",
      type: "TAREA",
      contactId: null,
      userId: currentUserId,
      priority: "MEDIA",
      notifyClient: false,
      notifyAgent: true,
      reminderMinutes: 15,
      status: "PENDING",
      ...defaultValues,
    } as never,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const { control } = form;

  useEffect(() => {
    if (open) {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      reset({
        title: "",
        type: "TAREA",
        contactId: null,
        userId: currentUserId,
        priority: "MEDIA",
        notifyClient: false,
        notifyAgent: true,
        reminderMinutes: 15,
        status: "PENDING",
        startDate: now,
        endDate: oneHourLater,
        ...defaultValues,
      } as never);
    }
  }, [open, currentUserId, defaultValues, reset]);

  function onSubmit(values: CreateEventInput) {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createEventAction(values)
          : await updateEventAction(eventId!, values);

      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([key, msgs]) => {
            const msg = msgs?.[0];
            if (msg) form.setError(key as keyof CreateEventInput, { message: msg });
          });
        }
        return;
      }

      toast.success(mode === "create" ? "Evento creado" : "Evento actualizado");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[640px] max-h-[92vh] flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-sky-500 to-cyan-600 px-6 py-5 flex-shrink-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {mode === "create" ? "Nuevo evento" : "Editar evento"}
                </h2>
                <p className="text-xs text-white/70 mt-0.5">
                  {mode === "create"
                    ? "Agenda una tarea, cita o recordatorio"
                    : "Modifica los datos del evento"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-white/80 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Información general */}
            <section className="space-y-3">
              <SectionTitle icon={FileText}>Información</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="col-span-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Ej. Llamar a cliente para renovación"
                  />
                  <FieldError message={errors.title?.message} />
                </div>

                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    {...register("type")}
                    className="crm-select"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <select
                    id="priority"
                    {...register("priority")}
                    className="crm-select"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="status">Estado</Label>
                  <select
                    id="status"
                    {...register("status")}
                    className="crm-select"
                  >
                    {EVENT_STATUS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Horario */}
            <section className="space-y-3">
              <SectionTitle icon={CalendarDays}>Horario</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label htmlFor="startDate">Inicio</Label>
                  <Controller
                    control={control}
                    name="startDate"
                    render={({ field }) => (
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={toDateTimeLocal(field.value)}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    )}
                  />
                  <FieldError message={errors.startDate?.message} />
                </div>

                <div>
                  <Label htmlFor="endDate">Fin</Label>
                  <Controller
                    control={control}
                    name="endDate"
                    render={({ field }) => (
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={toDateTimeLocal(field.value)}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    )}
                  />
                  <FieldError message={errors.endDate?.message} />
                </div>

                <div>
                  <Label htmlFor="reminderMinutes">Recordatorio (min)</Label>
                  <Input
                    id="reminderMinutes"
                    type="number"
                    min="0"
                    max="43200"
                    step="5"
                    {...register("reminderMinutes", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </section>

            {/* Asignación */}
            <section className="space-y-3">
              <SectionTitle icon={Users}>Asignación</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label htmlFor="contactId">Contacto vinculado</Label>
                  <select
                    id="contactId"
                    {...register("contactId")}
                    className="crm-select"
                  >
                    <option value="">Sin vincular</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="userId">Asignado a</Label>
                  <select
                    id="userId"
                    {...register("userId")}
                    className="crm-select"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Descripción / detalles</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    {...register("description")}
                    placeholder="Notas, agenda, link de Meet, etc."
                  />
                </div>

                <div className="col-span-2 flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("notifyAgent")}
                      className="crm-checkbox"
                    />
                    Notificar al asesor
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("notifyClient")}
                      className="crm-checkbox"
                      disabled
                    />
                    Notificar al cliente (próximamente)
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-slate-500"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-sky-500 to-cyan-600 hover:opacity-90 text-white shadow-sm min-w-[140px]"
            >
              {isPending
                ? "Guardando..."
                : mode === "create"
                  ? "Crear evento"
                  : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
