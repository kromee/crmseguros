import { NotFoundError } from "@/core/errors/app-error";
import { requireTenantSession } from "@/core/tenant";
import { prisma } from "@/infrastructure/prisma/client";
import { prospectsFiltersSchema } from "@/modules/prospects/schemas/prospect.schema";
import { prospectService } from "@/modules/prospects/services/prospect.service";
import { KanbanBoard } from "@/modules/prospects/components/kanban-board";
import { serializeProspect } from "@/modules/prospects/utils/serialize";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PipelinePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = prospectsFiltersSchema.parse({
    stage: params.stage,
    priority: params.priority,
    search: params.search,
  });

  const { tenantId } = await requireTenantSession();
  const [groups, overview] = await Promise.all([
    prospectService.listByStage(tenantId, filters),
    prospectService.getOverview(tenantId),
  ]);

  const serializedGroups: Record<string, ReturnType<typeof serializeProspect>[]> = {
    CONTACTO_INICIAL: groups.CONTACTO_INICIAL.map(serializeProspect),
    SEGUIMIENTO: groups.SEGUIMIENTO.map(serializeProspect),
    COTIZACION: groups.COTIZACION.map(serializeProspect),
    CIERRE: groups.CIERRE.map(serializeProspect),
  };

  const totalActive = Object.values(overview).reduce((sum, o) => sum + o.count, 0);

  const selectedId = params.selected;
  const allItems = Object.values(serializedGroups).flat();
  let selectedProspect = selectedId
    ? (allItems.find((p) => p.id === selectedId) ?? null)
    : null;
  let recentActivities: Array<{
    id: string;
    type: string;
    summary: string;
    result: string;
    createdAt: string;
    performer: { id: string; name: string } | null;
  }> = [];

  let nextEvent: {
    id: string;
    title: string;
    type: string;
    startDate: string;
    endDate: string;
    reminderMinutes: number;
    description: string | null;
    status: string;
  } | null = null;

  if (selectedId) {
    try {
      const full = await prospectService.getById(tenantId, selectedId);
      if (!selectedProspect) {
        // El prospecto puede estar fuera del filtro actual (ej. WON/LOST). Lo añadimos al drawer.
        selectedProspect = serializeProspect(full);
      }
      recentActivities = full.activities.map((a) => ({
        id: a.id,
        type: a.type,
        summary: a.summary,
        result: a.result,
        createdAt: a.createdAt.toISOString(),
        performer: a.performer,
      }));

      // Próximo evento de calendario asociado al contacto del prospecto.
      const upcoming = await prisma.calendarEvent.findFirst({
        where: {
          tenantId,
          contactId: full.contactId,
          status: "PENDING",
          startDate: { gte: new Date() },
        },
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          startDate: true,
          endDate: true,
          reminderMinutes: true,
          description: true,
          status: true,
        },
      });
      if (upcoming) {
        nextEvent = {
          ...upcoming,
          startDate: upcoming.startDate.toISOString(),
          endDate: upcoming.endDate.toISOString(),
        };
      }
    } catch (err) {
      if (!(err instanceof NotFoundError)) throw err;
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">Pipeline comercial</h1>
        <p className="text-sm text-theme-muted mt-0.5">
          Tablero Kanban de prospectos activos por etapa
        </p>
      </div>

      <KanbanBoard
        groups={serializedGroups}
        overview={overview}
        totalActive={totalActive}
        selectedProspect={selectedProspect}
        recentActivities={recentActivities}
        nextEvent={nextEvent}
      />
    </div>
  );
}
