"use client";

import { FileDown, FileText, FileUp, Lock, Trash2 } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  uploadPolicyFileAction,
  removePolicyFileAction,
} from "../actions/policy.actions";

interface Props {
  policyId: string;
  policyFile: string | null;
  /** Póliza vencida o cancelada: solo lectura */
  readOnly?: boolean;
}

export function PolicyFileUpload({ policyId, policyFile, readOnly = false }: Props) {
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
      const result = await uploadPolicyFileAction(policyId, formData);
      if (result.ok) {
        toast.success("Archivo adjuntado correctamente");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove() {
    if (readOnly) return;
    if (!confirm("¿Eliminar el archivo adjunto de esta póliza?")) return;
    startTransition(async () => {
      const result = await removePolicyFileAction(policyId);
      if (result.ok) {
        toast.success("Archivo eliminado");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (readOnly) {
    if (policyFile) {
      return (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-bg-input)] border border-theme">
          <FileText className="w-4 h-4 text-theme-muted flex-shrink-0" />
          <span className="text-xs text-theme-secondary font-medium flex-1 truncate">
            Póliza adjunta (solo lectura)
          </span>
          <a
            href={`/api/files/${policyFile}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <FileDown className="w-3 h-3" />
            Ver
          </a>
        </div>
      );
    }
    return (
      <p className="flex items-center gap-2 text-xs text-theme-muted p-2.5 rounded-lg bg-[var(--color-bg-input)] border border-theme-subtle">
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        Póliza vencida: no se pueden adjuntar archivos.
      </p>
    );
  }

  if (policyFile) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200">
        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span className="text-xs text-blue-700 font-medium flex-1 truncate">
          Póliza adjunta
        </span>
        <a
          href={`/api/files/${policyFile}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 transition-colors"
        >
          <FileDown className="w-3 h-3" />
          Ver
        </a>
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="flex items-center gap-1 text-[10px] font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleUpload}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-theme bg-[var(--color-bg-input)] text-xs text-theme-muted hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
      >
        <FileUp className="w-4 h-4" />
        {isPending ? "Subiendo..." : "Adjuntar archivo de póliza (PDF, imagen)"}
      </button>
    </div>
  );
}
