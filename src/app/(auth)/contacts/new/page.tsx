import { requireTenantSession } from "@/core/tenant";
import { getTenantCatalogUi } from "@/core/tenant/catalog-ui";
import { ContactForm } from "@/modules/contacts/components/contact-form";

export const dynamic = "force-dynamic";

export default async function NewContactPage() {
  const { tenantId } = await requireTenantSession();
  const catalog = await getTenantCatalogUi(tenantId);

  return <ContactForm mode="create" contactOrigins={catalog.contactOrigins} />;
}
