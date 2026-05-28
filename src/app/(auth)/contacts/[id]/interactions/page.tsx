import {
  ArrowLeft,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { ACTIVITY_TYPES } from "@/core/constants";
import { NotFoundError } from "@/core/errors/app-error";
import { getInitials } from "@/core/utils/format";
import { activityService } from "@/modules/activities/services/activity.service";
import { parseActivityAttachments } from "@/modules/activities/utils/attachments";
import { InteractionsTimeline } from "@/modules/activities/components/interactions-timeline";
import { NewActivityButton } from "@/modules/activities/components/new-activity-button";
import { contactService } from "@/modules/contacts/services/contact.service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

const FILTER_ICONS: Record<string, typeof Phone> = {
  LLAMADA: Phone,
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  NOTA: FileText,
  VISITA: User,
  DOCUMENTO: FileText,
};

export default async function ContactInteractionsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const filterType = sp.type;

  const session = await auth();
  if (!session?.user) return null;

  let contact;
  try {
    contact = await contactService.getById(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const [activities, counters] = await Promise.all([
    activityService.listByContact(id, filterType),
    activityService.countByContact(id),
  ]);

  const serialized = activities.map((a) => ({
    id: a.id,
    type: a.type,
    summary: a.summary,
    result: a.result,
    createdAt: a.createdAt.toISOString(),
    performedBy: a.performedBy,
    performer: a.performer,
    attachments: parseActivityAttachments(a.attachments),
  }));

  function tabHref(type: string | null) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    const q = params.toString();
    return `/contacts/${id}/interactions${q ? `?${q}` : ""}`;
  }

  return (
    <div className="space-y-5">
      {/* Header navegación */}
      <div className="flex items-center gap-2">
        <Link href={`/contacts/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
            Volver al contacto
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar contacto + filtros */}
        <aside className="space-y-4">
          <div className="crm-card p-5">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">
                  {getInitials(contact.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-sm font-semibold text-slate-800 leading-tight">
                  {contact.fullName}
                </h2>
                <p className="text-xs text-slate-400 font-mono">{contact.code}</p>
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p>
                <span className="text-slate-400">Teléfono:</span> {contact.phone}
              </p>
              <p>
                <span className="text-slate-400">Correo:</span>{" "}
                {contact.email ?? "—"}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Total interacciones
              </p>
              <p className="text-3xl font-bold text-slate-800">{counters.total}</p>
            </div>
          </div>

          <div className="crm-card p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Filtrar por tipo
            </p>
            <div className="space-y-1">
              <FilterTab
                href={tabHref(null)}
                active={!filterType}
                label="Todos"
                count={counters.total}
              />
              {ACTIVITY_TYPES.map((t) => {
                const Icon = FILTER_ICONS[t.value] ?? FileText;
                return (
                  <FilterTab
                    key={t.value}
                    href={tabHref(t.value)}
                    active={filterType === t.value}
                    label={t.label}
                    count={counters.byType[t.value] ?? 0}
                    icon={Icon}
                  />
                );
              })}
            </div>
          </div>
        </aside>

        {/* Timeline */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Bitácora de interacciones
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {filterType
                  ? `Filtrando: ${ACTIVITY_TYPES.find((t) => t.value === filterType)?.label}`
                  : "Todas las entradas registradas"}
              </p>
            </div>
            <NewActivityButton contactId={id} />
          </div>

          <InteractionsTimeline
            contactId={id}
            activities={serialized}
            currentUserId={session.user.id!}
            isAdmin={session.user.role === "ADMIN"}
          />
        </div>
      </div>
    </div>
  );
}

function FilterTab({
  href,
  active,
  label,
  count,
  icon: Icon,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  icon?: typeof Phone;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-blue-600 text-white font-medium"
          : "hover:bg-slate-50 text-slate-600"
      }`}
    >
      <span className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </span>
      <span className={`text-xs ${active ? "text-blue-100" : "text-slate-400"}`}>
        {count}
      </span>
    </Link>
  );
}
