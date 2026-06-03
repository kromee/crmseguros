"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, FileDown, Paperclip, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ACTIVITY_RESULTS, ACTIVITY_TYPES } from "@/core/constants";
import {
  createActivityAction,
  updateActivityAction,
} from "@/modules/activities/actions/activity.actions";
import {
  activityBaseSchema,
  type CreateActivityInput,
} from "@/modules/activities/schemas/activity.schema";
import type { ActivityAttachment } from "@/modules/activities/utils/attachments";

type FormValues = CreateActivityInput;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  contactId: string;
  activityId?: string;
  defaultValues?: Partial<FormValues>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-500 mt-1 font-medium">{message}</p>;
}

export function ActivityFormDialog({
  open,
  onOpenChange,
  mode,
  contactId,
  activityId,
  defaultValues,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [attachments, setAttachments] = useState<ActivityAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(activityBaseSchema) as never,
    defaultValues: {
      contactId,
      type: "LLAMADA",
      summary: "",
      result: "PENDIENTE",
      isAutomatic: false,
      ...defaultValues,
    } as never,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open) return;
    reset({
      contactId,
      type: "LLAMADA",
      summary: "",
      result: "PENDIENTE",
      isAutomatic: false,
      ...defaultValues,
    } as never);
    const timer = window.setTimeout(() => {
      setAttachments(defaultValues?.attachments ?? []);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, contactId, defaultValues, reset]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (attachments.length >= 5) {
      toast.error("Máximo 5 archivos por entrada");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("subfolder", "activities");

      const response = await fetch("/api/files/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error ?? "Error al subir archivo");
        return;
      }

      setAttachments((prev) => [
        ...prev,
        { path: data.file.path, originalName: data.file.originalName },
      ]);
    } catch {
      toast.error("Error al subir archivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeAttachment(path: string) {
    setAttachments((prev) => prev.filter((a) => a.path !== path));
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        attachments: attachments.length > 0 ? attachments : null,
      };
      const result =
        mode === "create"
          ? await createActivityAction(payload)
          : await updateActivityAction(activityId!, payload);

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

      toast.success(mode === "create" ? "Actividad registrada" : "Actividad actualizada");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[540px] max-h-[92vh] flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex-shrink-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {mode === "create" ? "Nueva entrada en bitácora" : "Editar entrada"}
                </h2>
                <p className="text-xs text-white/70 mt-0.5">
                  Registra una interacción con el contacto
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
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  {...register("type")}
                  className="crm-select"
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="result">Resultado</Label>
                <select
                  id="result"
                  {...register("result")}
                  className="crm-select"
                >
                  {ACTIVITY_RESULTS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="summary">Resumen</Label>
                <Textarea
                  id="summary"
                  rows={4}
                  {...register("summary")}
                  placeholder="Describe la llamada, el correo o la nota..."
                />
                <FieldError message={errors.summary?.message} />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Adjuntos (PDF, JPG, PNG — máx. 5)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  disabled={uploading || attachments.length >= 5}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border border-dashed border-theme bg-[var(--color-bg-input)] px-3 py-2.5 text-xs text-theme-secondary flex items-center justify-center gap-2 hover:bg-[var(--color-bg-hover)] disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? "Subiendo..." : "Agregar archivo"}
                </button>
                {attachments.length > 0 && (
                  <ul className="space-y-1.5">
                    {attachments.map((file) => (
                      <li
                        key={file.path}
                        className="flex items-center gap-2 rounded-lg border border-theme bg-[var(--color-bg-card)] px-2.5 py-2 text-xs"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-theme-muted flex-shrink-0" />
                        <span className="flex-1 truncate text-theme-secondary font-medium">
                          {file.originalName}
                        </span>
                        <a
                          href={`/api/files/${file.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Ver"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => removeAttachment(file.path)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Quitar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-end gap-2 border-t border-theme-subtle bg-[var(--color-bg-input)]/80 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-theme-muted"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white shadow-sm min-w-[140px]"
            >
              {isPending
                ? "Guardando..."
                : mode === "create"
                  ? "Registrar"
                  : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
