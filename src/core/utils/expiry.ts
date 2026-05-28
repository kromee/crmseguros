import { differenceInCalendarDays } from "date-fns";

export type ExpiryLevel = "expired" | "critical" | "warning" | "ok";

export interface ExpiryInfo {
  daysLeft: number;
  level: ExpiryLevel;
  label: string;
}

export function getExpiryInfo(endDate: Date | string | null | undefined): ExpiryInfo | null {
  if (!endDate) return null;
  const daysLeft = differenceInCalendarDays(new Date(endDate), new Date());

  let level: ExpiryLevel;
  let label: string;

  if (daysLeft < 0) {
    level = "expired";
    label = `Vencida hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) === 1 ? "" : "s"}`;
  } else if (daysLeft <= 7) {
    level = "critical";
    label = daysLeft === 0 ? "Vence hoy" : `Vence en ${daysLeft} día${daysLeft === 1 ? "" : "s"}`;
  } else if (daysLeft <= 30) {
    level = "warning";
    label = `Vence en ${daysLeft} días`;
  } else {
    level = "ok";
    label = `Vence en ${daysLeft} días`;
  }

  return { daysLeft, level, label };
}

/** Pólizas vencidas o canceladas no admiten subida de archivos. */
export function isPolicyClosedForFiles(
  status: string,
  endDate: Date | string | null | undefined
): boolean {
  if (status === "EXPIRED" || status === "CANCELLED") return true;
  if (status === "ACTIVE") {
    const expiry = getExpiryInfo(endDate);
    return expiry?.level === "expired";
  }
  return false;
}

export const EXPIRY_BADGE_CLASS: Record<ExpiryLevel, string> = {
  expired: "bg-red-100 text-red-700 border-red-200",
  critical: "bg-orange-100 text-orange-700 border-orange-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
