"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AtSign,
  Calendar,
  CalendarDays,
  ChevronRight,
  FileText,
  Phone,
  Save,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PROSPECT_SERVICE_GROUPS } from "@/core/constants";
import { formatCurrency } from "@/core/utils/format";
import { createProspectWithContactAction } from "../actions/prospect.actions";
import {
  createProspectWithContactSchema,
  type CreateProspectWithContactInput,
} from "../schemas/prospect.schema";

interface UserOption {
  id: string;
  name: string;
}

interface Props {
  users: UserOption[];
  currentUserId: string;
  contactOrigins: ReadonlyArray<{ value: string; label: string }>;
  defaultOrigin: string;
}

const PRIORITY_BUTTONS = [
  { value: "BAJA", label: "Baja", dot: "bg-emerald-500" },
  { value: "MEDIA", label: "Media", dot: "bg-blue-500" },
  { value: "ALTA", label: "Alta", dot: "bg-red-500" },
] as const;

const NEXT_ACTION_BUTTONS = [
  { value: "LLAMADA", label: "Llamada", icon: Phone },
  { value: "CITA", label: "Cita", icon: CalendarDays },
] as const;

const REMINDER_OPTIONS = [
  { value: 15, label: "15 minutos antes" },
  { value: 30, label: "30 minutos antes" },
  { value: 60, label: "1 hora antes" },
  { value: 1440, label: "1 día antes" },
];

function toDateTimeLocalDefault(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

export function ProspectCreateForm({
  users,
  currentUserId,
  contactOrigins,
  defaultOrigin,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateProspectWithContactInput>({
    resolver: zodResolver(createProspectWithContactSchema) as never,
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      origin: defaultOrigin,
      serviceOfInterest: "",
      estimatedValue: undefined,
      priority: "MEDIA",
      rating: 3,
      notes: "",
      assignedTo: currentUserId,
      nextActionType: "LLAMADA",
      reminderMinutes: 15,
    } as never,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const priority = watch("priority");
  const rating = watch("rating");
  const estimatedValue = watch("estimatedValue");
  const nextActionType = watch("nextActionType");

  function onSubmit(values: CreateProspectWithContactInput) {
    startTransition(async () => {
      const result = await createProspectWithContactAction(values);
      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([key, msgs]) => {
            const msg = msgs?.[0];
            if (msg)
              form.setError(
                key as keyof CreateProspectWithContactInput,
                { message: msg }
              );
          });
        }
        return;
      }
      toast.success(`Prospecto ${result.data.code} creado`);
      router.push(`/pipeline?selected=${result.data.prospectId}`);
    });
  }

  const estimatedNumber =
    typeof estimatedValue === "number" && Number.isFinite(estimatedValue)
      ? estimatedValue
      : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-theme-muted">
        <Link href="/pipeline" className="hover:text-theme-secondary">
          Comercial
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/pipeline" className="hover:text-theme-secondary">
          Pipeline
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-blue-600 font-medium">Nuevo Prospecto</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna izquierda — 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Información del Contacto */}
          <section className="crm-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-theme-primary flex items-center gap-2">
                <User className="w-4 h-4 text-theme-muted" />
                Información del Contacto
              </h2>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                Campos obligatorios
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nombre completo *</Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    {...register("fullName")}
                    placeholder="Ej. Juan Pérez García"
                    className="pr-9"
                  />
                  <User className="w-4 h-4 text-theme-muted/50 absolute right-3 top-2.5" />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      {...register("phone")}
                      placeholder="+52 (55) 1234 5678"
                      className="pr-9"
                    />
                    <Phone className="w-4 h-4 text-theme-muted/50 absolute right-3 top-2.5" />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="juan.perez@ejemplo.com"
                      className="pr-9"
                    />
                    <AtSign className="w-4 h-4 text-theme-muted/50 absolute right-3 top-2.5" />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin">Origen del prospecto *</Label>
                  <select
                    id="origin"
                    {...register("origin")}
                    className="crm-select"
                  >
                    {contactOrigins.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Prioridad *</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PRIORITY_BUTTONS.map((p) => {
                      const active = priority === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setValue("priority", p.value)}
                          className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                            active
                              ? "border-blue-300 bg-blue-50 text-blue-700"
                              : "border-theme bg-[var(--color-bg-card)] text-theme-secondary hover:bg-[var(--color-bg-hover)]"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Detalles de la Oportunidad */}
          <section className="crm-card p-5">
            <h2 className="font-semibold text-theme-primary mb-5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-theme-muted" />
              Detalles de la oportunidad
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceOfInterest">Servicio de interés *</Label>
                  <select
                    id="serviceOfInterest"
                    {...register("serviceOfInterest")}
                    className="crm-select"
                  >
                    <option value="">Seleccionar servicio</option>
                    {PROSPECT_SERVICE_GROUPS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.serviceOfInterest && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.serviceOfInterest.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="estimatedValue">Valor estimado (MXN)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-theme-muted text-sm">$</span>
                    <Input
                      id="estimatedValue"
                      type="number"
                      min="0"
                      step="100"
                      {...register("estimatedValue", { valueAsNumber: true })}
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  {...register("notes")}
                  placeholder="Detalles específicos del caso, requerimientos del cliente, contexto..."
                />
              </div>

              <div>
                <Label htmlFor="assignedTo">Asignado a</Label>
                <select
                  id="assignedTo"
                  {...register("assignedTo")}
                  className="crm-select"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar derecho — 1/3 */}
        <div className="space-y-5">
          {/* Próxima Acción */}
          <section className="p-5 rounded-xl shadow-sm bg-gradient-to-br from-blue-700 to-blue-800 text-white">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              Próxima acción
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-white mb-1.5">Tipo de acción</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {NEXT_ACTION_BUTTONS.map((a) => {
                    const Icon = a.icon;
                    const active = nextActionType === a.value;
                    return (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => setValue("nextActionType", a.value)}
                        className={`flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors border ${
                          active
                            ? "bg-emerald-500 text-white shadow-sm border-emerald-400"
                            : "bg-white/15 text-white border-white/30 hover:bg-white/25"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="nextActionDate" className="text-white">
                  Fecha programada
                </Label>
                <Input
                  id="nextActionDate"
                  type="datetime-local"
                  defaultValue={toDateTimeLocalDefault()}
                  {...register("nextActionDate" as never, {
                    setValueAs: (v: string) => (v ? new Date(v) : null),
                  })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 [color-scheme:dark]"
                />
              </div>

              <div>
                <Label htmlFor="reminderMinutes" className="text-white">
                  Recordatorio
                </Label>
                <select
                  id="reminderMinutes"
                  {...register("reminderMinutes", { valueAsNumber: true })}
                  className="crm-select !bg-white/10 !border-white/20 !text-white [color-scheme:dark]"
                >
                  {REMINDER_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value} className="text-theme-primary">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Resumen */}
          <section className="crm-card p-5">
            <h2 className="font-semibold text-theme-primary mb-4">Resumen</h2>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-theme-muted">Potencial</span>
                <span className="text-sm font-semibold text-theme-primary">
                  {formatCurrency(estimatedNumber)} MXN
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-theme-muted">Calificación</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setValue("rating", star)}
                      className="hover:scale-110 transition-transform"
                      aria-label={`${star} estrella${star === 1 ? "" : "s"}`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= (rating ?? 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-theme-muted/50"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10"
            >
              <Save className="w-4 h-4" />
              {isPending ? "Creando..." : "Crear Prospecto"}
            </Button>

            <Link
              href="/pipeline"
              className="w-full mt-2 h-10 flex items-center justify-center text-sm text-theme-secondary border border-theme rounded-md hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              Cancelar
            </Link>

            <p className="text-[11px] text-theme-muted text-center mt-3 leading-relaxed">
              Al crear, se generará automáticamente el contacto (tipo prospecto) y el
              evento de próxima acción en tu calendario.
              {nextActionType === "LLAMADA" && (
                <>
                  {" "}
                  <Calendar className="inline w-3 h-3" />
                </>
              )}
            </p>
          </section>
        </div>
      </div>
    </form>
  );
}
