"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, Lock, User, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/core/utils/format";
import {
  changeMyPasswordAction,
  updateMyAvatarAction,
  updateMyProfileAction,
} from "@/modules/users/actions/user.actions";
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from "@/modules/users/schemas/user.schema";

export type ProfileData = {
  id: string;
  name: string;
  email: string;
  title: string | null;
  avatar: string | null;
};

type UserProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData;
  onProfileChange?: (profile: ProfileData) => void;
};

export function UserProfileDialog({
  open,
  onOpenChange,
  profile,
  onProfileChange,
}: UserProfileDialogProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: profile.name,
      title: profile.title ?? "",
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (open) {
      profileForm.reset({ name: profile.name, title: profile.title ?? "" });
      passwordForm.reset();
    }
  }, [open, profile, profileForm, passwordForm]);

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("subfolder", "users");
      if (profile.avatar) fd.set("replacingPath", profile.avatar);

      const response = await fetch("/api/files/upload", { method: "POST", body: fd });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        toast.error(payload?.error ?? "No se pudo subir la foto");
        return;
      }

      const result = await updateMyAvatarAction(payload.file.path);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const avatarPath = payload.file.path as string;
      onProfileChange?.({ ...profile, avatar: avatarPath });
      await update({ image: avatarPath });
      toast.success("Foto actualizada");
      router.refresh();
    } catch {
      toast.error("Error al subir la foto");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onProfileSubmit(values: UpdateProfileInput) {
    startTransition(async () => {
      const res = await updateMyProfileAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      const title = values.title?.trim() ? values.title.trim() : null;
      onProfileChange?.({ ...profile, name: values.name, title });
      await update({ name: values.name, title });
      toast.success("Perfil actualizado");
      router.refresh();
    });
  }

  function onPasswordSubmit(values: ChangePasswordInput) {
    startTransition(async () => {
      const res = await changeMyPasswordAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Contraseña actualizada");
      passwordForm.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px] p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col"
        showCloseButton={false}
      >
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Mi perfil</h2>
                <p className="text-xs text-white/70 mt-0.5">Datos personales y contraseña</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              {profile.avatar && (
                <AvatarImage src={`/api/files/${profile.avatar}`} alt={profile.name} />
              )}
              <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadAvatar(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploading || isPending}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                Cambiar foto
              </Button>
              <p className="text-xs text-theme-muted mt-1">{profile.email}</p>
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="profile-name">Nombre completo</Label>
                <Input id="profile-name" {...profileForm.register("name")} />
                {profileForm.formState.errors.name && (
                  <p className="text-xs text-red-600 mt-1">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="profile-title">Cargo / título</Label>
                <Input
                  id="profile-title"
                  placeholder="Ej. Agente senior"
                  {...profileForm.register("title")}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Guardar perfil
            </Button>
          </form>

          <div className="border-t border-theme-subtle pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-theme-primary flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Cambiar contraseña
            </h3>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="current-password">Contraseña actual</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  {...passwordForm.register("currentPassword")}
                />
              </div>
              <div>
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("newPassword")}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("confirmPassword")}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button type="submit" variant="outline" disabled={isPending}>
                Actualizar contraseña
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
