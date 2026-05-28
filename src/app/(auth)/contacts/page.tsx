import { Download, MoreHorizontal, Printer, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CONTACT_ORIGINS, CONTACT_STATUS_LABELS } from "@/core/constants";
import { getInitials } from "@/core/utils/format";
import { contactsFiltersSchema } from "@/modules/contacts/schemas/contact.schema";
import { contactService } from "@/modules/contacts/services/contact.service";
import { contactRepository } from "@/modules/contacts/repositories/contact.repository";
import { ContactsFilters } from "@/modules/contacts/components/contacts-filters";
import { ContactsSearch } from "@/modules/contacts/components/contacts-search";
import { ContactsPagination } from "@/modules/contacts/components/contacts-pagination";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "badge-active",
  INACTIVE: "badge-inactive",
  PENDING: "badge-pending",
};

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-indigo-600",
  "bg-slate-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
];

function colorForName(name: string) {
  const hash = Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function originLabel(origin: string) {
  return CONTACT_ORIGINS.find((o) => o.value === origin)?.label ?? origin;
}

const ORIGIN_COLORS: Record<string, string> = {
  WHATSAPP: "bg-green-100 text-green-700",
  FACEBOOK: "bg-blue-100 text-blue-700",
  INSTAGRAM: "bg-pink-100 text-pink-700",
  TIKTOK: "bg-slate-900/10 text-slate-700",
  RECOMENDADO: "bg-yellow-100 text-yellow-700",
  FAMILIA: "bg-orange-100 text-orange-700",
  AMIGO: "bg-orange-100 text-orange-700",
  SITIO_WEB: "bg-slate-100 text-slate-600",
  GOOGLE_MAPS: "bg-red-100 text-red-700",
  PUBLICIDAD: "bg-purple-100 text-purple-700",
  STAND: "bg-teal-100 text-teal-700",
  OTRO: "bg-slate-100 text-slate-600",
};

export default async function ContactsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = contactsFiltersSchema.parse({
    type: params.type ?? "CLIENT",
    status: params.status,
    origin: params.origin,
    search: params.search,
    page: params.page ?? "1",
    pageSize: params.pageSize ?? "10",
  });

  const [list, counts] = await Promise.all([
    contactService.list(filters),
    contactRepository.countByType(),
  ]);

  const viewLabel = filters.type === "PROSPECT" ? "Prospectos" : "Clientes";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Directorio de Contactos</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Administra clientes y prospectos de Seguros Mexa
          </p>
        </div>
        <Link href="/contacts/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <UserPlus className="w-4 h-4" />
            Añadir Contacto
          </Button>
        </Link>
      </div>

      <div className="flex gap-5">
        <ContactsFilters counts={counts} />

        <div className="flex-1 crm-card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">
              Vista Actual: {viewLabel}
            </span>
            <ContactsSearch />
            <div className="flex items-center gap-2 ml-auto">
              <button className="p-1.5 hover:bg-slate-100 rounded-lg" title="Exportar">
                <Download className="w-4 h-4 text-slate-500" />
              </button>
              <button className="p-1.5 hover:bg-slate-100 rounded-lg" title="Imprimir">
                <Printer className="w-4 h-4 text-slate-500" />
              </button>
              <button className="p-1.5 hover:bg-slate-100 rounded-lg" title="Más">
                <MoreHorizontal className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {list.items.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">
              No se encontraron contactos con los filtros actuales.
            </div>
          ) : (
            <table className="w-full crm-table">
              <thead>
                <tr>
                  {["ID", "Nombre", "Teléfono / Correo", "Origen", "Ciudad", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.items.map((c) => (
                  <tr key={c.id} className="border-t border-slate-50">
                    <td className="px-5 py-3 text-xs text-slate-400 font-mono">{c.code}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/contacts/${c.id}`}
                        className="flex items-center gap-2.5 hover:opacity-80"
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          {c.photo && <AvatarImage src={`/api/files/${c.photo}`} alt={c.fullName} />}
                          <AvatarFallback
                            className={`${colorForName(c.fullName)} text-white text-xs font-semibold`}
                          >
                            {getInitials(c.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{c.fullName}</p>
                          <p className="text-xs text-slate-400">
                            {c.assignedUser?.name ?? "Sin asignar"}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-700">{c.phone}</p>
                      <p className="text-xs text-slate-400">{c.email ?? "—"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          ORIGIN_COLORS[c.origin] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {originLabel(c.origin)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {c.city ? `${c.city}${c.state ? `, ${c.state}` : ""}` : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          STATUS_BADGE[c.status] ?? "badge-pending"
                        }`}
                      >
                        {CONTACT_STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <ContactsPagination
            page={list.page}
            totalPages={list.totalPages}
            total={list.total}
            pageSize={list.pageSize}
          />
        </div>
      </div>
    </div>
  );
}
