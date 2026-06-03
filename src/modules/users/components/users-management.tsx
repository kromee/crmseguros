"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ShieldCheck, UserCog, KeyRound } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@prisma/client";
import { isTenantAdmin } from "@/core/tenant/roles";
import { getInitials } from "@/core/utils/format";
import {
  createUserAction,
  setUserActiveAction,
  setUserAvatarAction,
} from "../actions/user.actions";
import { createUserSchema, type CreateUserInput } from "../schemas/user.schema";
import { AdminPasswordResetDialog } from "./admin-password-reset-dialog";

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface Props {
  users: UserListItem[];
  currentUserId: string;
  canAddUser: boolean;
  maxUsers: number;
  activeUsers: number;
}

export function UsersManagement({
  users,
  currentUserId,
  canAddUser,
  maxUsers,
  activeUsers,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [uploadingUserId, setUploadingUserId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserListItem | null>(null);

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema) as never,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "USER",
      title: "",
      isActive: true,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  function onSubmit(values: CreateUserInput) {
    startTransition(async () => {
      const res = await createUserAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Usuario creado");
      reset();
      setCreateOpen(false);
    });
  }

  async function uploadAvatar(userId: string, file: File, currentAvatar: string | null) {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("subfolder", "users");
    if (currentAvatar) fd.set("replacingPath", currentAvatar);
    setUploadingUserId(userId);
    try {
      const response = await fetch("/api/files/upload", { method: "POST", body: fd });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        toast.error(payload?.error ?? "No se pudo subir el avatar");
        return;
      }
      const result = await setUserAvatarAction(userId, payload.file.path);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Avatar actualizado");
    } catch {
      toast.error("Error al subir avatar");
    } finally {
      setUploadingUserId(null);
      setTargetUserId(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <div className="crm-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-theme-primary flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            Gestión de usuarios (solo admin)
          </h2>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={!canAddUser}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Crear usuario
          </Button>
        </div>
        {!canAddUser && (
          <p className="text-xs text-amber-700 mt-3">
            Cupo de usuarios lleno ({activeUsers}/{maxUsers}). Desactiva un usuario para crear otro.
          </p>
        )}
        <p className="text-xs text-theme-muted mt-3">
          Puedes restablecer la contraseña de agentes (USER). La nueva contraseña se muestra una sola
          vez al guardar; compártela con el usuario por un canal seguro.
        </p>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 gap-0" showCloseButton={false}>
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                  <UserCog className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Crear usuario</h2>
                  <p className="text-xs text-white/70 mt-0.5">Solo administradores pueden crear usuarios</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="title">Puesto</Label>
              <Input id="title" {...register("title")} placeholder="Ej. Agente Senior" />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <select id="role" className="crm-select" {...register("role")}>
                <option value="USER">USER</option>
                <option value="TENANT_ADMIN">TENANT_ADMIN</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isPending ? "Creando..." : "Crear usuario"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="crm-card p-5">
        <h2 className="text-base font-semibold text-theme-primary flex items-center gap-2 mb-4">
          <UserCog className="w-4 h-4 text-indigo-600" />
          Usuarios del sistema
        </h2>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file || !targetUserId) return;
            const user = users.find((u) => u.id === targetUserId);
            uploadAvatar(targetUserId, file, user?.avatar ?? null);
          }}
        />
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-theme-subtle">
              <Avatar className="w-10 h-10">
                {u.avatar && <AvatarImage src={`/api/files/${u.avatar}`} alt={u.name} />}
                <AvatarFallback className="bg-[var(--color-bg-elevated)] text-theme-secondary text-xs font-semibold">
                  {getInitials(u.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-semibold text-theme-primary">{u.name}</p>
                <p className="text-xs text-theme-muted">{u.email}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${isTenantAdmin(u.role) ? "bg-purple-100 text-purple-700" : "bg-[var(--color-bg-elevated)] text-theme-secondary"}`}>
                {u.role}
              </span>
              <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {u.isActive ? "Autorizado" : "Desactivado"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTargetUserId(u.id);
                  fileRef.current?.click();
                }}
                disabled={uploadingUserId === u.id}
              >
                {uploadingUserId === u.id ? "Subiendo..." : "Foto"}
              </Button>
              {u.role === "USER" && u.id !== currentUserId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setResetUser(u)}
                  title="Restablecer contraseña del agente"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Contraseña
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant={u.isActive ? "outline" : "default"}
                disabled={u.id === currentUserId}
                className={u.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                onClick={() =>
                  startTransition(async () => {
                    const res = await setUserActiveAction(u.id, !u.isActive);
                    if (!res.ok) {
                      toast.error(res.error);
                      return;
                    }
                    toast.success(u.isActive ? "Usuario desactivado" : "Usuario autorizado");
                  })
                }
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                {u.isActive ? "Desactivar" : "Autorizar"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {resetUser && (
        <AdminPasswordResetDialog
          userId={resetUser.id}
          userName={resetUser.name}
          userEmail={resetUser.email}
          open={!!resetUser}
          onOpenChange={(open) => !open && setResetUser(null)}
        />
      )}
    </div>
  );
}
