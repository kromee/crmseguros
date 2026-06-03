import { Plus } from "lucide-react";
import { getTenantCatalogUi } from "@/core/tenant/catalog-ui";
import { requireTenantSession } from "@/core/tenant";
import { prisma } from "@/infrastructure/prisma/client";
import { ProspectCreateForm } from "@/modules/prospects/components/prospect-create-form";

export const dynamic = "force-dynamic";

export default async function NewProspectPage() {
  const { tenantId, userId } = await requireTenantSession();

  const [users, catalog] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getTenantCatalogUi(tenantId),
  ]);

  const defaultOrigin = catalog.contactOrigins[0]?.value ?? "WHATSAPP";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </div>
        <h1 className="text-xl font-bold text-theme-primary">Nuevo Prospecto</h1>
      </div>

      <ProspectCreateForm
        users={users}
        currentUserId={userId}
        contactOrigins={catalog.contactOrigins}
        defaultOrigin={defaultOrigin}
      />
    </div>
  );
}
