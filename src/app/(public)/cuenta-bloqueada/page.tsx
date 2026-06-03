import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = { title: "Cuenta bloqueada — CRM Seguros" };

export default function CuentaBloqueadaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-red-50 to-slate-100 dark:from-[#0c1222] dark:via-[#1a1015] dark:to-[#0c1222] px-4 py-10">
      <div className="w-full max-w-md crm-card p-8 text-center space-y-5">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100">
          <ShieldAlert className="w-7 h-7 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Acceso bloqueado</h1>
          <p className="text-sm text-theme-muted mt-2">
            Tu agencia no tiene acceso al CRM en este momento. Esto puede deberse a una suscripción
            vencida o a una suspensión administrativa.
          </p>
        </div>
        <p className="text-sm text-theme-secondary">
          Contacta a soporte para renovar tu plan o reactivar la cuenta.
        </p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
