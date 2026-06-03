import { enabledContactOrigins } from "@/core/tenant/catalog-settings";
import { tenantCatalogService } from "@/modules/tenants/services/tenant-catalog.service";

export async function getTenantCatalogUi(tenantId: string) {
  const settings = await tenantCatalogService.get(tenantId);
  return {
    insurers: settings.insurers,
    contactOrigins: enabledContactOrigins(settings).map((o) => ({
      value: o.value,
      label: o.label,
    })),
    contactOriginLabel: (value: string) =>
      settings.contactOrigins.find((o) => o.value === value)?.label ?? value,
  };
}
