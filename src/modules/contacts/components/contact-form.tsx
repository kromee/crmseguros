"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  ImagePlus,
  Phone,
  Save,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_ORIGINS,
  CONTACT_STATUS_LABELS,
  PROSPECT_SERVICE_GROUPS,
} from "@/core/constants";
import { formatCurrency, getInitials } from "@/core/utils/format";
import {
  createContactAction,
  updateContactAction,
} from "@/modules/contacts/actions/contact.actions";
import { contactBaseSchema } from "@/modules/contacts/schemas/contact.schema";
import { createProspectWithContactAction } from "@/modules/prospects/actions/prospect.actions";

const optionalDate = z
  .union([z.string().length(0), z.string().date(), z.string().datetime(), z.date()])
  .optional()
  .nullable()
  .transform((v) => (v && v !== "" ? new Date(v) : null));

const optionalDecimal = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  });

const combinedSchema = contactBaseSchema.extend({
  serviceOfInterest: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  estimatedValue: optionalDecimal,
  priority: z.enum(["BAJA", "MEDIA", "ALTA", "ATENCION"]).default("MEDIA"),
  rating: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1).max(5))
    .default(3),
  nextActionType: z
    .enum(["LLAMADA", "CITA", "EMAIL", "OTRO"])
    .optional()
    .nullable(),
  nextActionDate: optionalDate,
  reminderMinutes: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return 15;
      const n = Number(v);
      return Number.isFinite(n) ? n : 15;
    }),
});

type FormValues = z.input<typeof combinedSchema>;

interface Props {
  mode: "create" | "edit";
  contactId?: string;
  defaultValues?: Partial<FormValues>;
}

const TYPES = [
  { value: "PROSPECT", label: "Prospecto" },
  { value: "CLIENT", label: "Cliente" },
] as const;

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

export function ContactForm({ mode, contactId, defaultValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(combinedSchema) as never,
    defaultValues: {
      type: "PROSPECT",
      fullName: "",
      phone: "",
      email: "",
      city: "",
      state: "",
      origin: "WHATSAPP",
      status: "PENDING",
      notes: "",
      priority: "MEDIA",
      rating: 3,
      nextActionType: "LLAMADA",
      reminderMinutes: 15,
      ...defaultValues,
    } as FormValues,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const type = watch("type");
  const priority = watch("priority");
  const rating = watch("rating");
  const estimatedValue = watch("estimatedValue");
  const nextActionType = watch("nextActionType");
  const photo = watch("photo");

  const showProspectFields = mode === "create" && type === "PROSPECT";

  const estimatedNumber =
    typeof estimatedValue === "number" && Number.isFinite(estimatedValue)
      ? estimatedValue
      : 0;

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);
    formData.set("subfolder", "contacts");

    setIsUploadingPhoto(true);
    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        toast.error(payload?.error ?? "No se pudo subir la foto");
        return;
      }

      setValue("photo", payload.file.path, { shouldDirty: true });

      if (mode === "edit" && contactId) {
        const saveResult = await updateContactAction(contactId, {
          photo: payload.file.path,
        } as never);
        if (!saveResult.ok) {
          toast.error(saveResult.error ?? "No se pudo guardar la foto del contacto");
          return;
        }
        router.refresh();
      }

      toast.success("Foto de cliente cargada");
    } catch {
      toast.error("Error de red al subir la foto");
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      if (mode === "create" && values.type === "PROSPECT") {
        // Flujo unificado: crea contacto + prospecto + (opcional) evento de calendario.
        const result = await createProspectWithContactAction({
          fullName: values.fullName,
          phone: values.phone,
          email: values.email,
          photo: values.photo,
          origin: values.origin,
          serviceOfInterest: values.serviceOfInterest,
          estimatedValue: values.estimatedValue,
          priority: values.priority ?? "MEDIA",
          rating: values.rating ?? 3,
          notes: values.notes,
          nextActionType: values.nextActionType,
          nextActionDate: values.nextActionDate ?? undefined,
          reminderMinutes: values.reminderMinutes ?? 15,
        } as never);

        if (!result.ok) {
          toast.error(result.error);
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([key, msgs]) => {
              const msg = msgs?.[0];
              if (msg) form.setError(key as keyof FormValues, { message: msg });
            });
          }
          return;
        }
        toast.success(`Prospecto ${result.data.code} creado`);
        router.push(`/contacts/${result.data.contactId}`);
        return;
      }

      const cleanValues = {
        type: values.type,
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        photo: values.photo,
        birthDate: values.birthDate,
        activity: values.activity,
        city: values.city,
        state: values.state,
        origin: values.origin,
        status: values.status,
        notes: values.notes,
      };

      if (mode === "create") {
        const result = await createContactAction(cleanValues as never);
        if (!result.ok) {
          toast.error(result.error);
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([key, msgs]) => {
              const msg = msgs?.[0];
              if (msg) form.setError(key as keyof FormValues, { message: msg });
            });
          }
          return;
        }
        toast.success(`Contacto ${result.data.code} creado`);
        router.push(`/contacts/${result.data.id}`);
      } else {
        const result = await updateContactAction(contactId!, cleanValues as never);
        if (!result.ok) {
          toast.error(result.error);
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([key, msgs]) => {
              const msg = msgs?.[0];
              if (msg) form.setError(key as keyof FormValues, { message: msg });
            });
          }
          return;
        }
        toast.success("Contacto actualizado");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/contacts">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-slate-500"
          >
            <ArrowLeft className="w-4 h-4" />
            {mode === "create" ? "Añadir contacto" : "Editar contacto"}
          </Button>
        </Link>
      </div>

      <div
        className={`grid grid-cols-1 gap-5 ${
          showProspectFields ? "lg:grid-cols-3" : ""
        }`}
      >
        {/* Columna principal */}
        <div className={showProspectFields ? "lg:col-span-2 space-y-5" : "space-y-5"}>
          <div className="crm-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-800">Datos generales</h2>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setValue("type", t.value)}
                    className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                      type === t.value
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Foto del cliente</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    {photo && <AvatarImage src={`/api/files/${photo}`} alt="Foto del cliente" />}
                    <AvatarFallback className="bg-slate-200 text-slate-600 text-sm font-semibold">
                      {getInitials(watch("fullName") || "CL")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="gap-2"
                    >
                      <ImagePlus className="w-4 h-4" />
                      {isUploadingPhoto ? "Subiendo..." : "Subir foto"}
                    </Button>
                    {photo && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={async () => {
                          setValue("photo", "", { shouldDirty: true });
                          if (mode === "edit" && contactId) {
                            const saveResult = await updateContactAction(contactId, {
                              photo: "",
                            } as never);
                            if (!saveResult.ok) {
                              toast.error(saveResult.error ?? "No se pudo quitar la foto");
                              return;
                            }
                            router.refresh();
                          }
                        }}
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                        Quitar
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Formatos permitidos: JPG, PNG o WEBP (max 10MB).
                </p>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="fullName">Nombre completo *</Label>
                <Input
                  id="fullName"
                  {...register("fullName")}
                  placeholder="Ej. María González López"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input id="phone" {...register("phone")} placeholder="55 1234 5678" />
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="correo@dominio.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register("birthDate" as never)}
                />
              </div>

              <div>
                <Label htmlFor="activity">Actividad / Ocupación</Label>
                <Input
                  id="activity"
                  {...register("activity")}
                  placeholder="Ej. Médico, Abogado, Comerciante"
                />
              </div>

              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" {...register("city")} placeholder="Ej. CDMX" />
              </div>

              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="Ej. Ciudad de México"
                />
              </div>

              <div>
                <Label htmlFor="origin">Origen *</Label>
                <select
                  id="origin"
                  {...register("origin")}
                  className="crm-select"
                >
                  {CONTACT_ORIGINS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="status">Estado *</Label>
                <select
                  id="status"
                  {...register("status")}
                  className="crm-select"
                >
                  {Object.entries(CONTACT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  rows={3}
                  placeholder="Información adicional, intereses, observaciones..."
                />
              </div>
            </div>
          </div>

          {/* Detalles de la oportunidad (solo si es PROSPECT en create) */}
          {showProspectFields && (
            <div className="crm-card p-6">
              <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Detalles de la oportunidad
              </h2>

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
                </div>

                <div>
                  <Label htmlFor="estimatedValue">Valor estimado (MXN)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-sm">
                      $
                    </span>
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

                <div className="sm:col-span-2">
                  <Label>Prioridad</Label>
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
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${p.dot}`}
                          />
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar derecho — solo si es PROSPECT */}
        {showProspectFields && (
          <div className="space-y-5">
            {/* Próxima Acción */}
            <section className="p-5 rounded-xl shadow-sm bg-gradient-to-br from-blue-700 to-blue-800 text-white">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                Próxima acción
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-white mb-1.5">
                    Tipo de acción
                  </p>
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
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 [color-scheme:dark] focus-visible:bg-white/20 focus-visible:border-white/40 focus-visible:text-white focus-visible:ring-white/15"
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
                      <option key={r.value} value={r.value} className="text-slate-800">
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Resumen */}
            <section className="crm-card p-5">
              <h2 className="font-semibold text-slate-800 mb-4">Resumen</h2>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Potencial</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {formatCurrency(estimatedNumber)} MXN
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Calificación</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const currentRating = Number(rating ?? 0);
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setValue("rating", star)}
                          className="hover:scale-110 transition-transform"
                          aria-label={`${star} estrella${star === 1 ? "" : "s"}`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= currentRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Al crear el prospecto se generará automáticamente el contacto, una
                actividad inicial en su bitácora y el evento de próxima acción en tu
                calendario.
              </p>
            </section>
          </div>
        )}
      </div>

      {/* Footer de acciones */}
      <div className="flex justify-end gap-3 pt-2">
        <Link href="/contacts">
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Save className="w-4 h-4" />
          {isPending
            ? "Guardando..."
            : mode === "create"
              ? showProspectFields
                ? "Crear prospecto"
                : "Crear contacto"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
