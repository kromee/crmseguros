import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantBranding } from "@/core/tenant/branding";
import { getTenantEntitlements } from "@/core/tenant/entitlements";
import { Sidebar } from "@/shared/components/Sidebar";
import { TenantFooter } from "@/shared/components/TenantFooter";
import { Topbar } from "@/shared/components/Topbar";
import { RouteChangeIndicator } from "@/shared/components/route-change-indicator";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/shared/providers/session-provider";
import { ProfileDialogProvider } from "@/shared/providers/profile-dialog-provider";
import { TenantBrandingProvider } from "@/shared/providers/tenant-branding-provider";
import { TenantUsageAlerts } from "@/modules/tenants/components/tenant-plan-usage";
import { notificationService } from "@/modules/notifications/services/notification.service";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let usageAlerts = null;
  let branding = null;
  let notificationBadgeCount = 0;

  if (session.user.tenantId) {
    const entitlements = await getTenantEntitlements(session.user.tenantId);
    if (!entitlements.canOperate) {
      redirect("/cuenta-bloqueada");
    }
    usageAlerts = <TenantUsageAlerts entitlements={entitlements} />;
    branding = await getTenantBranding(session.user.tenantId);
    notificationBadgeCount = await notificationService.getBadgeCount(
      session.user.tenantId,
      session.user.id
    );
  }

  const content = (
    <div className="crm-layout">
      <Sidebar />
      <div className="crm-main">
        <RouteChangeIndicator />
        <Topbar user={session.user} notificationBadgeCount={notificationBadgeCount} />
        <main className="crm-content space-y-4">
          {usageAlerts}
          {children}
        </main>
        {branding ? <TenantFooter /> : null}
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );

  return (
    <AuthSessionProvider>
      <ProfileDialogProvider>
        {branding ? (
          <TenantBrandingProvider branding={branding}>{content}</TenantBrandingProvider>
        ) : (
          content
        )}
      </ProfileDialogProvider>
    </AuthSessionProvider>
  );
}
