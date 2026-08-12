"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  activateTenantSchema,
  type ActivateTenantInput,
} from "@/modules/licenses/schemas/license.schema";
import { activateTenantAction } from "@/modules/licenses/actions/license.actions";

export function ActivateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ActivateTenantInput>({
    resolver: zodResolver(activateTenantSchema),
    defaultValues: {
      licenseKey: "",
      companyName: "",
      adminName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: ActivateTenantInput) {
    setError(null);
    setSuccess(null);

    const result = await activateTenantAction(data);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(
      `Agencia "${result.data.tenantName}" activada. Inicia sesión con ${result.data.email}.`
    );
    setTimeout(() => router.push("/login"), 2500);
  }

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
          <KeyRound className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-theme-primary">Activar licencia</h1>
        <p className="text-sm text-theme-muted mt-1">
          Registra tu agencia con la clave proporcionada
        </p>
      </div>

      <div className="crm-card p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="licenseKey">Clave de licencia</Label>
            <Input
              id="licenseKey"
              placeholder="VALE-XXXX-XXXX-XXXX"
              className="uppercase tracking-wide"
              {...register("licenseKey")}
            />
            {errors.licenseKey && (
              <p className="text-xs text-red-600">{errors.licenseKey.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="companyName">Nombre de la agencia</Label>
            <Input id="companyName" placeholder="Seguros Ejemplo" {...register("companyName")} />
            {errors.companyName && (
              <p className="text-xs text-red-600">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adminName">Administrador</Label>
            <Input id="adminName" placeholder="Nombre completo" {...register("adminName")} />
            {errors.adminName && (
              <p className="text-xs text-red-600">{errors.adminName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo del administrador</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || Boolean(success)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activando...
              </>
            ) : (
              "Activar CRM"
            )}
          </Button>
        </form>

        <p className="text-sm text-center text-theme-muted mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>

      <p className="text-center text-xs text-theme-muted mt-6 flex items-center justify-center gap-1">
        <Shield className="w-3 h-3" />
        Plataforma CRM Seguros · SaaS privado
      </p>
    </div>
  );
}
