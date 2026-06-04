import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { tenantStoragePath } from "./tenant-paths";

/** Raíz absoluta de uploads/ — todas las rutas deben resolverse dentro de aquí */
export const UPLOAD_ROOT = path.resolve(
  process.cwd(),
  process.env.UPLOAD_DIR?.replace(/^\.\//, "") ?? "uploads"
);

const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export interface UploadResult {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
}

export interface SaveFileOptions {
  /** Si se indica, guarda en uploads/{tenantId}/{category}/ */
  tenantId?: string | null;
}

/**
 * Resuelve una ruta relativa bajo uploads/ y valida que no escape del directorio.
 * Devuelve null si la ruta es inválida o intenta path traversal.
 */
export function resolveUploadPath(relativePath: string): string | null {
  if (!relativePath || relativePath.includes("\0")) return null;

  const segments = relativePath.split(/[/\\]/);
  if (segments.some((segment) => segment === "..")) return null;

  const normalized = path.normalize(relativePath);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) return null;

  const absolute = path.resolve(UPLOAD_ROOT, normalized);
  const rel = path.relative(UPLOAD_ROOT, absolute);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;

  return absolute;
}

export async function saveFile(
  file: File,
  category = "general",
  options?: SaveFileOptions
): Promise<UploadResult> {
  if (file.size > MAX_SIZE) {
    throw new Error(`El archivo excede el límite de ${MAX_SIZE / 1024 / 1024} MB`);
  }

  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    throw new Error(
      `Tipo de archivo no permitido: ${file.type}. Permitidos: PDF, JPG, PNG, WEBP`
    );
  }

  const subfolder = tenantStoragePath(options?.tenantId, category);
  const dir = path.join(UPLOAD_ROOT, subfolder);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const filePath = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    filename,
    originalName: file.name,
    path: `${subfolder}/${filename}`,
    size: file.size,
    mimeType: file.type,
  };
}

export async function deleteFile(relativePath: string): Promise<void> {
  const filePath = resolveUploadPath(relativePath);
  if (!filePath) return;

  try {
    await unlink(filePath);
  } catch {
    // Si no existe, no pasa nada
  }
}

export function getAbsolutePath(relativePath: string): string {
  const resolved = resolveUploadPath(relativePath);
  if (!resolved) {
    throw new Error("Ruta de archivo inválida");
  }
  return resolved;
}

export { tenantStoragePath } from "./tenant-paths";
