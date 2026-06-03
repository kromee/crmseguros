import Link from "next/link";
import { HelpCircle, Mail, MessageCircle, Phone } from "lucide-react";
import { requireTenantSession } from "@/core/tenant";
import { getTenantBranding } from "@/core/tenant/branding";

export const dynamic = "force-dynamic";

export const metadata = { title: "Soporte — CRM Seguros" };

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "soporte@segurosmexa.com";
const SUPPORT_PHONE = process.env.SUPPORT_PHONE ?? "+52 55 1234 5678";
const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP_URL ?? "https://wa.me/525512345678";

export default async function SupportPage() {
  const { tenantId } = await requireTenantSession();
  const branding = await getTenantBranding(tenantId);

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">Soporte</h1>
        <p className="text-sm text-theme-muted mt-0.5">
          Ayuda para {branding.name} y el CRM Seguros Mexa
        </p>
      </div>

      <div className="crm-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/15">
            <HelpCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-theme-primary">¿Necesitas ayuda?</h2>
            <p className="text-sm text-theme-muted">
              Contacta al equipo de soporte para incidencias, renovación de plan o capacitación.
            </p>
          </div>
        </div>

        <ul className="space-y-3 text-sm">
          <li>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-theme-subtle hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <Mail className="w-4 h-4 text-blue-600" />
              <span>
                <span className="font-medium text-theme-primary block">Correo</span>
                {SUPPORT_EMAIL}
              </span>
            </a>
          </li>
          <li>
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-theme-subtle hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              <span>
                <span className="font-medium text-theme-primary block">Teléfono</span>
                {SUPPORT_PHONE}
              </span>
            </a>
          </li>
          <li>
            <a
              href={SUPPORT_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-theme-subtle hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-green-600" />
              <span>
                <span className="font-medium text-theme-primary block">WhatsApp</span>
                Escríbenos por chat
              </span>
            </a>
          </li>
        </ul>

        <div className="text-sm text-theme-muted border-t border-theme-subtle pt-4 space-y-2">
          <p>
            <strong className="text-theme-secondary">Horario:</strong> Lun–Vie 9:00–18:00 (CDMX)
          </p>
          <p>
            Para temas de facturación o cambio de plan comercial, un administrador de plataforma
            puede ayudarte desde el panel SaaS.
          </p>
          <Link href="/settings" className="text-blue-600 hover:underline inline-block">
            Ver plan y límites de tu agencia →
          </Link>
        </div>
      </div>
    </div>
  );
}
