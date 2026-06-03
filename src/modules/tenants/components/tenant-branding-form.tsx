"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, ChevronRight, ImageIcon, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  updateTenantBrandingSchema,
  type UpdateTenantBrandingInput,
} from "@/modules/tenants/schemas/tenant-branding.schema";
import {
  removeTenantLogoAction,
  updateTenantBrandingAction,
} from "@/modules/tenants/actions/tenant-branding.actions";

type BrandingData = {
  name: string;
  logo: string | null;
  slogan: string | null;
};

export function TenantBrandingForm({
  branding,
  embedded = false,
}: {
  branding: BrandingData;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateTenantBrandingInput>({
    resolver: zodResolver(updateTenantBrandingSchema),
    defaultValues: {
      name: branding.name,
      slogan: branding.slogan ?? "",
      logo: branding.logo,
    },
  });

  const logo = watch("logo");

  useEffect(() => {
    if (!open) {
      reset({
        name: branding.name,
        slogan: branding.slogan ?? "",
        logo: branding.logo,
      });
    }
  }, [branding, open, reset]);

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("subfolder", "branding");
      if (logo) fd.set("replacingPath", logo);

      const response = await fetch("/api/files/upload", { method: "POST", body: fd });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        toast.error(payload?.error ?? "No se pudo subir el logo");
        return;
      }

      setValue("logo", payload.file.path, { shouldDirty: true });
      toast.success("Logo cargado. Guarda los cambios para aplicarlo.");
    } catch {
      toast.error("Error al subir el logo");
    } finally {
      setUploadingLogo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onSubmit(values: UpdateTenantBrandingInput) {
    startTransition(async () => {
      const result = await updateTenantBrandingAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Marca de la agencia actualizada");
      setOpen(false);
      router.refresh();
    });
  }

  function handleRemoveLogo() {
    startTransition(async () => {
      const result = await removeTenantLogoAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setValue("logo", null, { shouldDirty: true });
      toast.success("Logo eliminado");
      router.refresh();
    });
  }

  const summary = branding.slogan?.trim()
    ? branding.slogan.trim()
    : branding.logo
      ? "Logo configurado"
      : "Sin slogan ni logo";

  const triggerClass = embedded
    ? "group flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-hover)] min-w-0"
    : "group flex w-full items-center gap-3 rounded-lg border border-theme bg-[var(--color-bg-card)] px-4 py-2.5 text-left transition-colors hover:border-blue-300/50 hover:bg-[var(--color-bg-hover)]";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
        {branding.logo ? (
          <div className="w-7 h-7 rounded-md border border-theme bg-[var(--color-bg-input)] flex items-center justify-center overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/files/${branding.logo}`}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-theme-primary truncate">Marca de la agencia</p>
          <p className="text-xs text-theme-muted truncate">
            {embedded ? branding.name : `${branding.name} · ${summary}`}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-theme-muted group-hover:text-blue-600 transition-colors flex-shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-[520px] p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col"
          showCloseButton={false}
        >
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Marca de la agencia</h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    Nombre comercial, logo y slogan del CRM
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form
            id="tenant-branding-form"
            onSubmit={handleSubmit(onSubmit)}
            className="overflow-y-auto flex-1 px-6 py-5 space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre comercial</Label>
              <Input id="name" placeholder="Seguros Mexa" {...register("name")} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slogan">Slogan o frase</Label>
              <Textarea
                id="slogan"
                rows={2}
                placeholder="Innovando tu seguridad, protegiendo tu mañana."
                {...register("slogan")}
              />
              {errors.slogan && <p className="text-xs text-red-600">{errors.slogan.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-theme bg-[var(--color-bg-input)] flex items-center justify-center overflow-hidden">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/files/${logo}`} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-theme-muted/50" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadLogo(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingLogo || isPending}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      "Subir logo"
                    )}
                  </Button>
                  {logo && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      className="text-red-600 border-red-200"
                      onClick={handleRemoveLogo}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Quitar
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-theme-muted">
                PNG, JPG o WEBP. Recomendado: cuadrado, mín. 128×128 px.
              </p>
            </div>
          </form>

          <div className="flex-shrink-0 flex items-center justify-end gap-2 border-t border-theme-subtle px-6 py-4 bg-[var(--color-bg-input)]/60">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="tenant-branding-form"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar marca
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
