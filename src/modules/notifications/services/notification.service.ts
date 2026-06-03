import { dashboardService, type DashboardAlert } from "@/modules/dashboard/services/dashboard.service";
import { reminderService } from "@/modules/reminders/services/reminder.service";
import { prisma } from "@/infrastructure/prisma/client";

export type NotificationItem = {
  id: string;
  severity: "danger" | "warning" | "info";
  title: string;
  detail: string;
  href: string;
  category: DashboardAlert["category"] | "reminder";
};

const SEVERITY_ORDER = { danger: 0, warning: 1, info: 2 } as const;

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export const notificationService = {
  /** Conteo ligero para el badge del topbar */
  async getBadgeCount(tenantId: string, userId: string): Promise<number> {
    const now = new Date();
    const in3 = addDays(now, 3);

    const [remindersDue, overduePolicies, criticalPolicies, overdueProspectActions] =
      await Promise.all([
        reminderService.countDue(tenantId, userId),
        prisma.policy.count({
          where: {
            tenantId,
            status: "ACTIVE",
            endDate: { lt: startOfDay(now) },
            renewedBy: null,
          },
        }),
        prisma.policy.count({
          where: {
            tenantId,
            status: "ACTIVE",
            endDate: { gte: startOfDay(now), lte: in3 },
          },
        }),
        prisma.prospect.count({
          where: {
            tenantId,
            status: "ACTIVE",
            nextActionDate: { lt: startOfDay(now) },
          },
        }),
      ]);

    return remindersDue + overduePolicies + criticalPolicies + overdueProspectActions;
  },

  /** Feed para el panel del topbar (prioriza lo urgente) */
  async getFeed(tenantId: string, userId: string, limit = 8): Promise<NotificationItem[]> {
    const [alerts, reminders] = await Promise.all([
      dashboardService.getAllAlerts(tenantId),
      reminderService.getQueue(tenantId, userId),
    ]);

    const reminderItems: NotificationItem[] = reminders
      .filter((r) => r.status === "due" || r.status === "overdue" || r.status === "upcoming")
      .slice(0, 4)
      .map((r) => ({
        id: `reminder-${r.id}`,
        severity:
          r.status === "overdue" ? "danger" : r.status === "due" ? "warning" : ("info" as const),
        title:
          r.status === "overdue"
            ? "Recordatorio vencido"
            : r.status === "due"
              ? "Recordatorio pendiente"
              : "Recordatorio próximo",
        detail: `${r.title}${r.contact ? ` · ${r.contact.fullName}` : ""}`,
        href: r.contact ? `/contacts/${r.contact.id}` : "/reminders",
        category: "reminder" as const,
      }));

    const alertItems: NotificationItem[] = alerts.map((a) => ({
      id: a.id,
      severity: a.severity,
      title: a.title,
      detail: a.detail,
      href: a.href ?? "/dashboard",
      category: a.category,
    }));

    return [...reminderItems, ...alertItems]
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
      .slice(0, limit);
  },
};
