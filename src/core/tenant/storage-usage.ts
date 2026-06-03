import { stat } from "fs/promises";
import { prisma } from "@/infrastructure/prisma/client";
import { getAbsolutePath } from "@/infrastructure/storage/local-storage";
import { parseActivityAttachments } from "@/modules/activities/utils/attachments";

function addPath(paths: Set<string>, value: string | null | undefined) {
  if (value?.trim()) paths.add(value.trim());
}

function addJsonPaths(paths: Set<string>, value: unknown) {
  if (!value) return;

  if (typeof value === "string") {
    addPath(paths, value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") addPath(paths, item);
      else if (typeof item === "object" && item !== null && "path" in item) {
        addPath(paths, String((item as { path: string }).path));
      }
    }
    return;
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (record.files && typeof record.files === "object" && record.files !== null) {
      for (const filePath of Object.values(record.files as Record<string, unknown>)) {
        if (typeof filePath === "string") addPath(paths, filePath);
      }
    }
    for (const nested of Object.values(record)) {
      if (typeof nested === "string" && nested.includes("/")) addPath(paths, nested);
    }
  }
}

export async function collectTenantFilePaths(tenantId: string): Promise<string[]> {
  const [tenant, users, contacts, policies, activities, events, vehicles] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { logo: true } }),
    prisma.user.findMany({ where: { tenantId }, select: { avatar: true } }),
    prisma.contact.findMany({ where: { tenantId }, select: { photo: true } }),
    prisma.policy.findMany({
      where: { tenantId },
      select: { policyFile: true, vehiclePhoto: true, documents: true },
    }),
    prisma.activity.findMany({ where: { tenantId }, select: { attachments: true } }),
    prisma.calendarEvent.findMany({ where: { tenantId }, select: { attachments: true } }),
    prisma.vehicleService.findMany({ where: { tenantId }, select: { documents: true } }),
  ]);

  const paths = new Set<string>();

  addPath(paths, tenant?.logo);
  for (const user of users) addPath(paths, user.avatar);
  for (const contact of contacts) addPath(paths, contact.photo);
  for (const policy of policies) {
    addPath(paths, policy.policyFile);
    addPath(paths, policy.vehiclePhoto);
    addJsonPaths(paths, policy.documents);
  }
  for (const activity of activities) {
    for (const attachment of parseActivityAttachments(activity.attachments)) {
      addPath(paths, attachment.path);
    }
  }
  for (const event of events) addJsonPaths(paths, event.attachments);
  for (const vehicle of vehicles) addJsonPaths(paths, vehicle.documents);

  return [...paths];
}

export async function getPathsSizeBytes(paths: string[]): Promise<number> {
  let total = 0;
  for (const relativePath of paths) {
    try {
      const info = await stat(getAbsolutePath(relativePath));
      if (info.isFile()) total += info.size;
    } catch {
      // archivo ausente en disco
    }
  }
  return total;
}

export async function getTenantStorageUsedBytes(tenantId: string): Promise<number> {
  const paths = await collectTenantFilePaths(tenantId);
  return getPathsSizeBytes(paths);
}

export function bytesToMb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}
