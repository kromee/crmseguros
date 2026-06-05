"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/modules/auth/schemas/login.schema";
import { credentialsLoginAction } from "@/modules/auth/actions/login.actions";
import { LoginBrandingHeader } from "./login-branding-header";

const ERROR_MESSAGES: Record<string, string> = {
  active_session:
    "Esta cuenta ya tiene una sesión activa en otro dispositivo o navegador. Cierra sesión allí o espera a que expire (máx. 8 horas).",
  rate_limit:
    "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.",
  invalid: "Credenciales incorrectas.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [canTakeover, setCanTakeover] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function completeLogin(data: LoginInput, takeoverSession = false) {
    setError(null);
    setCanTakeover(false);

    const result = await credentialsLoginAction({ ...data, takeoverSession });
    if (!result.ok) {
      if (result.canTakeover) {
        setCanTakeover(true);
        setError(
          "Ya hay una sesión activa con esta cuenta. Como administrador, puedes cerrarla en el otro dispositivo confirmando tu contraseña."
        );
        return;
      }
      setError(ERROR_MESSAGES[result.code] ?? ERROR_MESSAGES.invalid);
      return;
    }

    const session = await getSession();
    const target =
      session?.user?.role === "SUPER_ADMIN"
        ? "/platform"
        : callbackUrl.startsWith("/platform")
          ? "/dashboard"
          : callbackUrl;

    router.push(target);
    router.refresh();
  }

  async function onSubmit(data: LoginInput) {
    await completeLogin(data);
  }

  async function handleTakeover() {
    setIsTakingOver(true);
    try {
      await completeLogin(getValues(), true);
    } finally {
      setIsTakingOver(false);
    }
  }

  const busy = isSubmitting || isTakingOver;

  return (
    <div className="w-full max-w-md">
      <LoginBrandingHeader />

      <div className="crm-card p-8">
        <h2 className="text-lg font-semibold text-theme-primary mb-1">Iniciar sesión</h2>
        <p className="text-sm text-theme-muted mb-6">Ingresa tus credenciales para continuar</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@agencia.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div
              className={
                canTakeover
                  ? "text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                  : "text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
              }
            >
              {error}
            </div>
          )}

          {canTakeover ? (
            <Button
              type="button"
              disabled={busy}
              onClick={handleTakeover}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white h-10"
            >
              {isTakingOver ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cerrando sesión anterior...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión en el otro dispositivo e ingresar
                </>
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          )}
        </form>

        <p className="text-sm text-center text-theme-muted mt-6">
          ¿Tienes una clave de licencia?{" "}
          <Link href="/activar" className="text-blue-600 hover:underline">
            Activar agencia
          </Link>
        </p>
      </div>
    </div>
  );
}
