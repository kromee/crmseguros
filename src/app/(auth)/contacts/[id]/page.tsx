import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  Globe,
  History,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CONTACT_ORIGINS, CONTACT_STATUS_LABELS } from "@/core/constants";
import { NotFoundError } from "@/core/errors/app-error";
import { formatDate, getInitials } from "@/core/utils/format";
import { activityService } from "@/modules/activities/services/activity.service";
import { parseActivityAttachments } from "@/modules/activities/utils/attachments";
import { InteractionsTimeline } from "@/modules/activities/components/interactions-timeline";
import { NewActivityButton } from "@/modules/activities/components/new-activity-button";
import { EditContactDialog } from "@/modules/contacts/components/edit-contact-dialog";
import { contactService } from "@/modules/contacts/services/contact.service";
import { ContactServicesTabs } from "@/modules/services/components/contact-services-tabs";
import {
  serializePension,
  serializePolicy,
  serializeVehicle,
} from "@/modules/services/utils/serialize";

export const dynamic = "force-dynamic";

function originLabel(value: string) {
  return CONTACT_ORIGINS.find((o) => o.value === value)?.label ?? value;
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;

  let contact;
  try {
    contact = await contactService.getById(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const policies = contact.policies.map(serializePolicy);
  const pensions = contact.pensionServices.map(serializePension);
  const vehicles = contact.vehicleServices.map(serializeVehicle);

  const activityCounters = await activityService.countByContact(id);
  const recentActivities = contact.activities.slice(0, 5).map((a) => ({
    id: a.id,
    type: a.type,
    summary: a.summary,
    result: a.result,
    createdAt: a.createdAt.toISOString(),
    performedBy: a.performedBy,
    performer: a.performer,
    attachments: parseActivityAttachments(a.attachments),
  }));

  const typeLabel = contact.type === "CLIENT" ? "Cliente" : "Prospecto";
  const statusLabel = CONTACT_STATUS_LABELS[contact.status] ?? contact.status;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/contacts">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
            Detalle de contacto
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna izquierda — perfil */}
        <div className="space-y-5">
          {/* Tarjeta de perfil */}
          <div className="crm-card p-5">
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="w-16 h-16 flex-shrink-0">
                {contact.photo && (
                  <AvatarImage src={`/api/files/${contact.photo}`} alt={contact.fullName} />
                )}
                <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                  {getInitials(contact.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-bold text-slate-800">{contact.fullName}</h1>
                <p className="text-sm text-slate-400 font-mono">{contact.code}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    {typeLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {contact.phone}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {contact.email ?? "Sin correo"}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {contact.birthDate
                  ? formatDate(contact.birthDate, "dd MMM yyyy")
                  : "Fecha de nacimiento no registrada"}
              </div>
              {contact.activity && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {contact.activity}
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                {originLabel(contact.origin)}
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Asignado a: {contact.assignedUser?.name ?? "Sin asignar"}
              </div>
              {(contact.city || contact.state) && (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {contact.city}
                  {contact.state ? `, ${contact.state}` : ""}
                </div>
              )}
            </div>

            {/* Contador de interacciones */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Interacciones registradas
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-800">
                  {activityCounters.total}
                </p>
                <Link
                  href={`/contacts/${id}/interactions`}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <History className="w-3 h-3" />
                  Ver bitácora
                </Link>
              </div>
            </div>

            <div className="mt-4">
              <EditContactDialog
                contactId={contact.id}
                defaultValues={{
                  type: contact.type,
                  fullName: contact.fullName,
                  phone: contact.phone,
                  email: contact.email ?? "",
                  photo: contact.photo ?? "",
                  birthDate: contact.birthDate ?? undefined,
                  activity: contact.activity ?? "",
                  city: contact.city ?? "",
                  state: contact.state ?? "",
                  origin: contact.origin,
                  status: contact.status,
                  notes: contact.notes ?? "",
                }}
              />
            </div>
          </div>

          {/* Bitácora */}
          <div className="crm-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">Bitácora reciente</h2>
              <NewActivityButton contactId={id} variant="outline" label="Nueva" />
            </div>

            <InteractionsTimeline
              contactId={id}
              activities={recentActivities}
              currentUserId={session.user.id!}
              isAdmin={session.user.role === "ADMIN"}
            />

            {activityCounters.total > recentActivities.length && (
              <Link href={`/contacts/${id}/interactions`} className="block mt-4">
                <Button variant="outline" className="w-full text-sm h-9">
                  Ver historial completo ({activityCounters.total})
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Columna derecha — servicios con tabs reales */}
        <div className="lg:col-span-2">
          <ContactServicesTabs
            contactId={contact.id}
            policies={policies}
            pensions={pensions}
            vehicles={vehicles}
          />
        </div>
      </div>
    </div>
  );
}
