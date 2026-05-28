import { Bell } from "lucide-react";
import { auth } from "@/auth";
import { RemindersQueue } from "@/modules/reminders/components/reminders-queue";
import { reminderService } from "@/modules/reminders/services/reminder.service";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const items = await reminderService.getQueue(session.user.id);

  const serialized = items.map((item) => ({
    ...item,
    startDate: item.startDate.toISOString(),
    endDate: item.endDate.toISOString(),
    reminderAt: item.reminderAt.toISOString(),
  }));

  const dueCount = items.filter(
    (i) => i.status === "due" || i.status === "overdue"
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-7 h-7 text-amber-500" />
            Cola de recordatorios
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Eventos del calendario según la hora de recordatorio configurada.
            Sin envío automático por WhatsApp (próxima fase).
          </p>
        </div>
        {dueCount > 0 && (
          <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full">
            {dueCount} requieren atención
          </span>
        )}
      </div>

      <RemindersQueue items={serialized} />
    </div>
  );
}
