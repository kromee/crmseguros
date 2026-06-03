"use client";

import { Car, ImagePlus, Lock, Trash2 } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  removeVehiclePhotoAction,
  uploadVehiclePhotoAction,
} from "../actions/policy.actions";

interface Props {
  policyId: string;
  vehiclePhoto: string | null;
  compact?: boolean;
  readOnly?: boolean;
}

export function PolicyVehiclePhotoUpload({
  policyId,
  vehiclePhoto,
  compact = false,
  readOnly = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (readOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadVehiclePhotoAction(policyId, formData);
      if (result.ok) {
        toast.success("Foto del vehículo guardada");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove() {
    if (readOnly) return;
    if (!confirm("¿Eliminar la foto del vehículo?")) return;
    startTransition(async () => {
      const result = await removeVehiclePhotoAction(policyId);
      if (result.ok) {
        toast.success("Foto eliminada");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (readOnly) {
    if (vehiclePhoto) {
      return (
        <div className={compact ? "space-y-2" : "space-y-3"}>
          <p className="text-xs font-semibold text-theme-muted uppercase tracking-wide flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5" />
            Foto del vehículo (solo lectura)
          </p>
          <div
            className={`relative overflow-hidden rounded-lg border border-theme bg-[var(--color-bg-input)] ${
              compact ? "max-w-[200px]" : "max-w-xs"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/files/${vehiclePhoto}`}
              alt="Vehículo asegurado"
              className="w-full h-auto object-cover aspect-[4/3]"
            />
          </div>
          <a
            href={`/api/files/${vehiclePhoto}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Ver en tamaño completo
          </a>
        </div>
      );
    }
    return (
      <p className="flex items-center gap-2 text-xs text-theme-muted">
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        Póliza vencida: no se puede subir foto del vehículo.
      </p>
    );
  }

  if (vehiclePhoto) {
    return (
      <div className={compact ? "space-y-2" : "space-y-3"}>
        <p className="text-xs font-semibold text-theme-muted uppercase tracking-wide flex items-center gap-1.5">
          <Car className="w-3.5 h-3.5" />
          Foto del vehículo
        </p>
        <div
          className={`relative overflow-hidden rounded-lg border border-theme bg-[var(--color-bg-input)] ${
            compact ? "max-w-[200px]" : "max-w-xs"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/files/${vehiclePhoto}`}
            alt="Vehículo asegurado"
            className="w-full h-auto object-cover aspect-[4/3]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/files/${vehiclePhoto}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Ver en tamaño completo
          </a>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
            Quitar foto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <p className="text-xs font-semibold text-theme-muted uppercase tracking-wide flex items-center gap-1.5">
        <Car className="w-3.5 h-3.5" />
        Foto del vehículo
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 text-xs text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
      >
        <ImagePlus className="w-4 h-4" />
        {isPending ? "Subiendo..." : "Subir foto del auto (JPG, PNG, WEBP)"}
      </button>
    </div>
  );
}
