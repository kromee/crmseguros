import { requireTenantSession } from "@/core/tenant";
import { prisma } from "@/infrastructure/prisma/client";
import { CalendarMonthView } from "@/modules/calendar/components/calendar-month-view";
import { eventService } from "@/modules/calendar/services/event.service";
import { autoEventsService } from "@/modules/calendar/services/auto-events.service";
import { serializeEvent } from "@/modules/calendar/utils/serialize";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const { tenantId, userId } = await requireTenantSession();

  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month !== undefined ? Number(params.month) : now.getMonth();
  const contactId = params.contactId ?? null;
  const focusEventId = params.event ?? null;

  const [events, autoEvents, contacts, users] = await Promise.all([
    eventService.listMonth(tenantId, null, year, month, contactId),
    contactId ? Promise.resolve([]) : autoEventsService.getForMonth(tenantId, year, month),
    prisma.contact.findMany({
      where: { tenantId },
      orderBy: { fullName: "asc" },
      select: { id: true, code: true, fullName: true },
      take: 500,
    }),
    prisma.user.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const serialized = events.map(serializeEvent);

  const filterContact = contactId
    ? contacts.find((c) => c.id === contactId) ?? null
    : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">Calendario operativo</h1>
        <p className="text-sm text-theme-muted mt-0.5">
          {filterContact
            ? `Eventos de ${filterContact.fullName}`
            : "Renovaciones, cobranza, llamadas y tareas del equipo"}
        </p>
      </div>

      {filterContact && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
          <span className="text-sm text-blue-800">
            Mostrando eventos de <strong>{filterContact.fullName}</strong> ({filterContact.code})
          </span>
          <a
            href="/calendar"
            className="ml-auto text-xs font-medium text-blue-600 hover:text-blue-800 underline"
          >
            Ver todos los eventos
          </a>
        </div>
      )}

      <CalendarMonthView
        year={year}
        month={month}
        events={serialized}
        autoEvents={autoEvents}
        contacts={contacts}
        users={users}
        currentUserId={userId}
        totalEvents={serialized.length + autoEvents.length}
        focusEventId={focusEventId}
      />
    </div>
  );
}
