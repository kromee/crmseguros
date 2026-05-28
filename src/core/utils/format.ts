import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(date: Date | string, pattern = "dd MMM yyyy"): string {
  return format(new Date(date), pattern, { locale: es });
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: es });
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function getPolicyProgressPercent(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function getDaysUntilExpiry(endDate: Date | string): number {
  return differenceInDays(new Date(endDate), new Date());
}

export function generateContactCode(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `SM-${num}`;
}

export function generateProspectCode(): string {
  const num = Math.floor(Math.random() * 900) + 100;
  return `PR-${num}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
