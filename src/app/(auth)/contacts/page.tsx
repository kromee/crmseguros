import { UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CONTACT_STATUS_LABELS } from "@/core/constants";
import { getInitials } from "@/core/utils/format";
import { requireTenantSession } from "@/core/tenant";
import { getTenantBranding } from "@/core/tenant/branding";
import { getTenantCatalogUi } from "@/core/tenant/catalog-ui";
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

const ORIGIN_COLORS: Record<string, string> = {
  WHATSAPP: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  FACEBOOK: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  INSTAGRAM: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400",
  TIKTOK: "bg-black/10 text-theme-secondary dark:bg-white/10 dark:text-slate-300",
  RECOMENDADO: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  FAMILIA: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  AMIGO: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  SITIO_WEB: "bg-[var(--color-bg-elevated)] text-theme-secondary dark:bg-white/10 dark:text-slate-300",
  GOOGLE_MAPS: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  PUBLICIDAD: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  STAND: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
  OTRO: "bg-[var(--color-bg-elevated)] text-theme-secondary dark:bg-white/10 dark:text-slate-300",
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

  const { tenantId } = await requireTenantSession();
  const [list, counts, branding, catalog, growth] = await Promise.all([
    contactService.list(tenantId, filters),
    contactRepository.countByType(tenantId),
    getTenantBranding(tenantId),
    getTenantCatalogUi(tenantId),
    contactRepository.getMonthlyClientGrowth(tenantId),
  ]);

  const viewLabel = filters.type === "PROSPECT" ? "Prospectos" : "Clientes";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Directorio de Contactos</h1>
          <p className="text-sm text-theme-secondary mt-0.5">
            Administra clientes y prospectos de {branding.name}
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
        <ContactsFilters counts={counts} growth={growth} contactOrigins={catalog.contactOrigins} />

        <div className="flex-1 crm-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-theme-subtle">
            <span className="text-sm font-medium theme-chip px-3 py-1 rounded-full whitespace-nowrap">
              Vista Actual: {viewLabel}
            </span>
            <ContactsSearch />
          </div>

          {list.items.length === 0 ? (
            <div className="p-12 text-center text-sm text-theme-muted">
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
                  <tr key={c.id} className="border-t border-theme-subtle">
                    <td className="px-5 py-3 text-xs text-theme-muted font-mono">{c.code}</td>
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
                          <p className="text-sm font-semibold text-theme-primary">{c.fullName}</p>
                          <p className="text-xs text-theme-muted">
                            {c.assignedUser?.name ?? "Sin asignar"}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-theme-secondary">{c.phone}</p>
                      <p className="text-xs text-theme-muted">{c.email ?? "—"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          ORIGIN_COLORS[c.origin] ?? "bg-[var(--color-bg-elevated)] text-theme-secondary dark:bg-white/10 dark:text-slate-300"
                        }`}
                      >
                        {catalog.contactOriginLabel(c.origin)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-theme-secondary">
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
