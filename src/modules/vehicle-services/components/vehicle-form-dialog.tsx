"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Car,
  CheckCircle2,
  ClipboardCheck,
  Download,
  CreditCard,
  FileCheck,
  FileText,
  Receipt,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  VEHICLE_DOCUMENT_TYPES,
  VEHICLE_REQUEST_MODES,
  VEHICLE_SERVICE_TYPES,
} from "@/core/constants";
import {
  createVehicleAction,
  updateVehicleAction,
} from "@/modules/vehicle-services/actions/vehicle.actions";
import {
  vehicleBaseSchema,
  type CreateVehicleInput,
} from "@/modules/vehicle-services/schemas/vehicle.schema";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "IN_PROGRESS", label: "En proceso" },
  { value: "COMPLETED", label: "Completado" },
  { value: "CANCELLED", label: "Cancelado" },
];

type FormValues = CreateVehicleInput;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  contactId: string;
  vehicleId?: string;
  defaultValues?: Partial<FormValues>;
}

function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-500 mt-1 font-medium">{message}</p>;
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof Car;
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

const DOC_ICON: Record<string, typeof FileText> = {
  ine: FileCheck,
  tarjetaCirculacion: CreditCard,
  factura: Receipt,
  titulo: FileText,
};

export function VehicleFormDialog({
  open,
  onOpenChange,
  mode,
  contactId,
  vehicleId,
  defaultValues,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(vehicleBaseSchema) as never,
    defaultValues: {
      contactId,
      serviceType: "ALTA",
      requestMode: "TRAMITE",
      status: "PENDING",
      documentChecklist: {
        ine: false,
        tarjetaCirculacion: false,
        factura: false,
        titulo: false,
      },
      documentFiles: {},
      ...defaultValues,
    } as never,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const selectedMode = watch("requestMode");
  const docChecklist = watch("documentChecklist");
  const docFiles = watch("documentFiles");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadDoc, setActiveUploadDoc] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      reset({
        contactId,
        serviceType: "ALTA",
        requestMode: "TRAMITE",
        status: "PENDING",
        documentChecklist: {
          ine: false,
          tarjetaCirculacion: false,
          factura: false,
          titulo: false,
        },
        documentFiles: {},
        ...defaultValues,
        startDate: defaultValues?.startDate ?? new Date(),
      } as never);
    }
  }, [open, contactId, defaultValues, reset]);

  async function handleUploadFile(docKey: string, file: File) {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("subfolder", "vehicles/documents");

    setUploadingKey(docKey);
    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        toast.error(payload?.error ?? "No se pudo subir el archivo");
        return;
      }

      setValue(`documentFiles.${docKey}` as never, payload.file.path as never, {
        shouldDirty: true,
      });
      setValue(`documentChecklist.${docKey}` as never, true as never, {
        shouldDirty: true,
      });
      toast.success("Archivo subido");
    } catch {
      toast.error("Error al subir archivo");
    } finally {
      setUploadingKey(null);
      setActiveUploadDoc(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handlePickFile(docKey: string) {
    setActiveUploadDoc(docKey);
    fileInputRef.current?.click();
  }

  function handleRemoveFile(docKey: string) {
    setValue(`documentFiles.${docKey}` as never, null as never, { shouldDirty: true });
    setValue(`documentChecklist.${docKey}` as never, false as never, { shouldDirty: true });
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createVehicleAction(values)
          : await updateVehicleAction(vehicleId!, values);

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

      toast.success(mode === "create" ? "Trámite registrado" : "Trámite actualizado");
      onOpenChange(false);
      router.refresh();
    });
  }

  const completedDocs = docChecklist
    ? Object.values(docChecklist).filter(Boolean).length
    : 0;
  const totalDocs = VEHICLE_DOCUMENT_TYPES.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[620px] max-h-[92vh] flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 flex-shrink-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {mode === "create" ? "Nuevo trámite vehicular" : "Editar trámite vehicular"}
                </h2>
                <p className="text-xs text-white/70 mt-0.5">
                  {mode === "create"
                    ? "Registra una cotización o trámite de vehículo"
                    : "Modifica los datos del trámite"}
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

          {/* Selector Cotización / Trámite */}
          <div className="relative mt-4 grid grid-cols-2 gap-2">
            {VEHICLE_REQUEST_MODES.map((m) => {
              const active = selectedMode === m.value;
              const MIcon = m.value === "COTIZACION" ? Receipt : ClipboardCheck;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setValue("requestMode", m.value as "COTIZACION" | "TRAMITE")}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? "bg-white text-slate-800 shadow-md"
                      : "bg-white/15 text-white/90 hover:bg-white/25 backdrop-blur-sm"
                  }`}
                >
                  <MIcon className="w-4 h-4" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !activeUploadDoc) return;
              handleUploadFile(activeUploadDoc, file);
            }}
          />
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Datos del trámite */}
            <section className="space-y-3">
              <SectionTitle icon={Car}>Datos del trámite</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label htmlFor="serviceType">Tipo de trámite</Label>
                  <select
                    id="serviceType"
                    {...register("serviceType")}
                    className="crm-select"
                  >
                    {VEHICLE_SERVICE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
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
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="startDate">Fecha de inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    defaultValue={toDateInput(defaultValues?.startDate as Date | undefined)}
                    {...register("startDate" as never, {
                      setValueAs: (v: string) => (v ? new Date(v) : undefined),
                    })}
                  />
                  <FieldError message={errors.startDate?.message} />
                </div>

                <div>
                  <Label htmlFor="quote">Cotización</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">$</span>
                    <Input
                      id="quote"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      {...register("quote", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Sección de documentos */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionTitle icon={FileCheck}>Documentos</SectionTitle>
                <span className="text-[11px] font-medium text-slate-400">
                  {completedDocs}/{totalDocs} recibidos
                </span>
              </div>

              {/* Barra de progreso de documentos */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_DOCUMENT_TYPES.map((doc) => {
                  const DIcon = DOC_ICON[doc.key] ?? FileText;
                  const checked = docChecklist?.[doc.key as keyof typeof docChecklist] ?? false;
                  const filePath = docFiles?.[doc.key as keyof typeof docFiles] ?? null;
                  const isUploadingThis = uploadingKey === doc.key;
                  return (
                    <label
                      key={doc.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setValue(
                            `documentChecklist.${doc.key}` as `documentChecklist.ine`,
                            e.target.checked
                          )
                        }
                        className="sr-only"
                      />
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-colors ${
                        checked
                          ? "bg-emerald-100"
                          : "bg-slate-100"
                      }`}>
                        {checked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <DIcon className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          checked ? "text-emerald-800" : "text-slate-700"
                        }`}>
                          {doc.label}
                        </p>
                        <p className={`text-[10px] ${
                          checked ? "text-emerald-600" : "text-slate-400"
                        }`}>
                          {checked
                            ? filePath
                              ? "Documento recibido con archivo"
                              : "Documento recibido"
                            : "Pendiente de recibir"}
                        </p>
                        {filePath && (
                          <a
                            href={`/api/files/${filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-3 h-3" />
                            Ver archivo
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePickFile(doc.key);
                          }}
                          className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          <Upload className="w-3 h-3" />
                          {isUploadingThis ? "Subiendo..." : filePath ? "Reemplazar" : "Subir"}
                        </button>
                        {filePath && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveFile(doc.key);
                            }}
                            className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="w-3 h-3" />
                            Quitar
                          </button>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Descripción */}
            <section className="space-y-3">
              <SectionTitle icon={FileText}>Descripción</SectionTitle>
              <Textarea
                id="description"
                rows={3}
                {...register("description")}
                placeholder="Detalles del trámite, vehículo, observaciones..."
              />
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
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white shadow-sm min-w-[140px]"
            >
              {isPending ? "Guardando..." : mode === "create" ? "Registrar" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
