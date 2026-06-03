"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, KeyRound, Loader2, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateTemporaryPassword } from "@/core/utils/password";
import { adminResetUserPasswordAction } from "../actions/user.actions";
import {
  adminResetPasswordSchema,
  type AdminResetPasswordInput,
} from "../schemas/user.schema";

interface Props {
  userId: string;
  userName: string;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminPasswordResetDialog({
  userId,
  userName,
  userEmail,
  open,
  onOpenChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);

  const form = useForm<AdminResetPasswordInput>({
    resolver: zodResolver(adminResetPasswordSchema),
    defaultValues: {
      userId,
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = form;

  const newPassword = watch("newPassword");

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset({ userId, newPassword: "", confirmPassword: "" });
      setRevealedPassword(null);
    } else {
      reset({ userId, newPassword: "", confirmPassword: "" });
      setRevealedPassword(null);
    }
    onOpenChange(next);
  }

  function generatePassword() {
    const pwd = generateTemporaryPassword(12);
    setValue("newPassword", pwd, { shouldValidate: true });
    setValue("confirmPassword", pwd, { shouldValidate: true });
    setRevealedPassword(null);
  }

  function onSubmit(values: AdminResetPasswordInput) {
    startTransition(async () => {
      const res = await adminResetUserPasswordAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setRevealedPassword(values.newPassword);
      toast.success("Contraseña actualizada");
    });
  }

  async function copyPassword() {
    if (!revealedPassword) return;
    try {
      await navigator.clipboard.writeText(revealedPassword);
      toast.success("Contraseña copiada");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0" showCloseButton={false}>
        <div className="relative bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Restablecer contraseña</h2>
              <p className="text-xs text-white/70 mt-0.5 truncate">{userName} · {userEmail}</p>
            </div>
          </div>
        </div>

        {revealedPassword ? (
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-theme-secondary">
              La contraseña quedó actualizada. Compártela con el usuario de forma segura; no se
              puede volver a consultar después.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-[var(--color-bg-input)] border border-theme rounded-lg px-3 py-2.5 break-all">
                {revealedPassword}
              </code>
              <Button type="button" variant="outline" size="icon" onClick={copyPassword}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button type="button" className="w-full" onClick={() => handleOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
            <input type="hidden" {...register("userId")} />

            <p className="text-xs text-theme-muted">
              Las contraseñas guardadas están cifradas. Define una nueva y muéstrala al usuario una
              sola vez.
            </p>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={generatePassword}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Generar aleatoria
              </Button>
            </div>

            <div>
              <Label htmlFor="admin-new-password">Nueva contraseña</Label>
              <Input
                id="admin-new-password"
                type="text"
                autoComplete="new-password"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="admin-confirm-password">Confirmar contraseña</Label>
              <Input
                id="admin-confirm-password"
                type="text"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {newPassword && newPassword.length >= 8 && (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-lg px-3 py-2">
                Anota o copia la contraseña antes de guardar; después no podrás verla de nuevo.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar contraseña
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
