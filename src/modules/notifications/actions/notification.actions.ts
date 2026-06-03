"use server";

import { AppError } from "@/core/errors/app-error";
import { requireTenantSession } from "@/core/tenant";
import type { ActionResult } from "@/core/types/action-result";
import {
  notificationService,
  type NotificationItem,
} from "../services/notification.service";

export async function getNotificationsAction(): Promise<
  ActionResult<{ badgeCount: number; items: NotificationItem[] }>
> {
  try {
    const session = await requireTenantSession();
    const [badgeCount, items] = await Promise.all([
      notificationService.getBadgeCount(session.tenantId, session.userId),
      notificationService.getFeed(session.tenantId, session.userId),
    ]);
    return { ok: true, data: { badgeCount, items } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AppError ? err.message : "No se pudieron cargar las notificaciones",
    };
  }
}
