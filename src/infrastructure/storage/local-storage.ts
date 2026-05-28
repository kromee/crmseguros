import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

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

export async function saveFile(
  file: File,
  subfolder = "general"
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

  const dir = path.join(UPLOAD_DIR, subfolder);
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
  const filePath = path.join(UPLOAD_DIR, relativePath);
  try {
    await unlink(filePath);
  } catch {
    // Si no existe, no pasa nada
  }
}

export function getAbsolutePath(relativePath: string): string {
  return path.join(UPLOAD_DIR, relativePath);
}
