import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertCanUpload } from "@/core/tenant/entitlements";
import { saveFile } from "@/infrastructure/storage/local-storage";
import { normalizeUploadCategory } from "@/infrastructure/storage/tenant-paths";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = normalizeUploadCategory(
      (formData.get("subfolder") as string) || "general"
    );
    const replacingRaw = formData.get("replacingPath") as string | null;
    const replacingPaths = replacingRaw?.trim() ? [replacingRaw.trim()] : [];

    if (!file) {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
    }

    await assertCanUpload(tenantId, file.size, replacingPaths);
    const result = await saveFile(file, category, { tenantId });

    return NextResponse.json({ ok: true, file: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al subir archivo";
    const status = message.includes("Almacenamiento") || message.includes("suscripción") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
