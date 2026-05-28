"use client";

import {
  CheckCircle2,
  Edit,
  FileDown,
  FileText,
  Mail,
  MessageCircle,
  Paperclip,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  ACTIVITY_RESULTS,
  ACTIVITY_TYPES,
} from "@/core/constants";
import { formatDateTime, timeAgo } from "@/core/utils/format";
import { deleteActivityAction } from "@/modules/activities/actions/activity.actions";
import type { ActivityAttachment } from "@/modules/activities/utils/attachments";
import { ActivityFormDialog } from "./activity-form-dialog";

type ActivityDTO = {
  id: string;
  type: string;
  summary: string;
  result: string;
  createdAt: string;
  performedBy: string;
  performer: { id: string; name: string; title: string | null } | null;
  attachments: ActivityAttachment[];
};

interface Props {
  contactId: string;
  activities: ActivityDTO[];
  currentUserId: string;
  isAdmin: boolean;
}

const STYLE: Record<
  string,
  { icon: typeof Phone; color: string; bg: string; border: string }
> = {
  LLAMADA: {
    icon: Phone,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  EMAIL: {
    icon: Mail,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  WHATSAPP: {
    icon: MessageCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  NOTA: {
    icon: FileText,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-100",
  },
  VISITA: {
    icon: User,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  DOCUMENTO: {
    icon: FileText,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
};

const RESULT_BADGE: Record<string, string> = {
  EXITOSO: "bg-emerald-100 text-emerald-700",
  PENDIENTE: "bg-amber-100 text-amber-700",
  SIN_RESPUESTA: "bg-slate-100 text-slate-600",
  FINALIZADO: "bg-blue-100 text-blue-700",
};

function typeLabel(type: string) {
  return ACTIVITY_TYPES.find((t) => t.value === type)?.label ?? type;
}

function resultLabel(result: string) {
  return ACTIVITY_RESULTS.find((r) => r.value === result)?.label ?? result;
}

export function InteractionsTimeline({
  contactId,
  activities,
  currentUserId,
  isAdmin,
}: Props) {
  const [editing, setEditing] = useState<ActivityDTO | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta entrada de la bitácora?")) return;
    const res = await deleteActivityAction(id, contactId);
    if (res.ok) toast.success("Entrada eliminada");
    else toast.error(res.error);
  }

  if (activities.length === 0) {
    return (
      <div className="crm-card p-12 text-center">
        <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">
          Aún no hay entradas en la bitácora.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Usa &ldquo;Nueva entrada&rdquo; para registrar la primera interacción.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {activities.map((act) => {
          const style = STYLE[act.type] ?? STYLE.NOTA;
          const Icon = style.icon;
          const canEdit = isAdmin || act.performedBy === currentUserId;

          return (
            <div
              key={act.id}
              className={`crm-card p-4 border-l-4 ${style.border}`}
              style={{ borderLeftColor: undefined }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${style.bg} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${style.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">
                        {typeLabel(act.type)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          RESULT_BADGE[act.result] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {resultLabel(act.result)}
                      </span>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditing(act)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(act.id)}
                          className="p-1 hover:bg-red-50 rounded text-red-500"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {act.summary}
                  </p>

                  {act.attachments.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {act.attachments.map((file) => (
                        <li key={file.path}>
                          <a
                            href={`/api/files/${file.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                          >
                            <Paperclip className="w-3 h-3" />
                            {file.originalName}
                            <FileDown className="w-3 h-3 opacity-60" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="text-xs text-slate-400 mt-2">
                    {formatDateTime(act.createdAt)} · {timeAgo(act.createdAt)} ·{" "}
                    {act.performer?.name ?? "Sistema"}
                    {act.performer?.title ? ` (${act.performer.title})` : ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <ActivityFormDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          mode="edit"
          contactId={contactId}
          activityId={editing.id}
          defaultValues={{
            contactId,
            type: editing.type as never,
            summary: editing.summary,
            result: editing.result as never,
            isAutomatic: false,
            attachments: editing.attachments,
          }}
        />
      )}
    </>
  );
}
