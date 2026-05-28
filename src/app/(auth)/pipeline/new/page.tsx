import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/infrastructure/prisma/client";
import { ProspectCreateForm } from "@/modules/prospects/components/prospect-create-form";

export const dynamic = "force-dynamic";

export default async function NewProspectPage() {
  const session = await auth();
  if (!session?.user) return null;

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Nuevo Prospecto</h1>
      </div>

      <ProspectCreateForm users={users} currentUserId={session.user.id!} />
    </div>
  );
}
