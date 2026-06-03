import { isTenantAdmin } from "@/core/tenant/roles";
import { requireTenantSession } from "@/core/tenant";
import { getTenantEntitlements } from "@/core/tenant/entitlements";
import { tenantBrandingService } from "@/modules/tenants/services/tenant-branding.service";
import { tenantCatalogService } from "@/modules/tenants/services/tenant-catalog.service";
import { TenantBrandingForm } from "@/modules/tenants/components/tenant-branding-form";
import { TenantCatalogForm } from "@/modules/tenants/components/tenant-catalog-form";
import { TenantPlanUsageCard } from "@/modules/tenants/components/tenant-plan-usage";
import { UsersManagement } from "@/modules/users/components/users-management";
import { userService } from "@/modules/users/services/user.service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireTenantSession();
  const isAdmin = isTenantAdmin(session.role);

  if (!isAdmin) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Configuración</h1>
          <p className="text-sm text-theme-muted mt-0.5">
            Opciones de tu cuenta en la agencia
          </p>
        </div>
        <div className="crm-card p-4 max-w-lg text-sm text-theme-muted">
          Para editar tu perfil (nombre, foto o contraseña), abre el menú de tu usuario arriba a
          la derecha y elige <span className="font-medium text-theme-secondary">Mi perfil</span>.
        </div>
      </div>
    );
  }

  const [entitlements, branding, catalog] = await Promise.all([
    getTenantEntitlements(session.tenantId),
    tenantBrandingService.get(session.tenantId),
    tenantCatalogService.get(session.tenantId),
  ]);

  const users = await userService.list(session.tenantId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">Configuración</h1>
        <p className="text-sm text-theme-muted mt-0.5">
          Marca de la agencia, catálogos y administración de usuarios
        </p>
      </div>

      <div className="crm-card overflow-hidden max-w-xl grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-theme-subtle">
        <TenantBrandingForm branding={branding} embedded />
        <TenantCatalogForm catalog={catalog} embedded />
      </div>

      <TenantPlanUsageCard entitlements={entitlements} />
      <UsersManagement
        users={users}
        currentUserId={session.userId}
        canAddUser={entitlements.canAddUser}
        maxUsers={entitlements.maxUsers}
        activeUsers={entitlements.activeUsers}
      />
    </div>
  );
}
