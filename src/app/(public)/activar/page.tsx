import { Suspense } from "react";
import { ActivateForm } from "@/modules/licenses/components/activate-form";

export const metadata = {
  title: "Activar licencia — CRM Seguros",
};

export default function ActivarPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 dark:login-page-bg px-4 py-10">
      <Suspense fallback={<div className="text-theme-muted">Cargando...</div>}>
        <ActivateForm />
      </Suspense>
    </div>
  );
}
