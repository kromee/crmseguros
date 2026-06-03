import { Suspense } from "react";
import { PRODUCT_NAME } from "@/core/constants";
import { LoginForm } from "./_components/login-form";

export const metadata = {
  title: `Iniciar sesión — ${PRODUCT_NAME}`,
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 dark:login-page-bg px-4">
      <Suspense fallback={<div className="text-theme-muted">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
