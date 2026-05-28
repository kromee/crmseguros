import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAbsolutePath } from "@/infrastructure/storage/local-storage";

const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { path: segments } = await params;
  const relativePath = segments.join("/");

  if (relativePath.includes("..")) {
    return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
  }

  const absolutePath = getAbsolutePath(relativePath);

  if (!existsSync(absolutePath)) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const ext = "." + relativePath.split(".").pop()?.toLowerCase();
  const contentType = MIME_MAP[ext] || "application/octet-stream";

  const buffer = await readFile(absolutePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${relativePath.split("/").pop()}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
