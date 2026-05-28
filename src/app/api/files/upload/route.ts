import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveFile } from "@/infrastructure/storage/local-storage";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const subfolder = (formData.get("subfolder") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
    }

    const result = await saveFile(file, subfolder);

    return NextResponse.json({ ok: true, file: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al subir archivo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
