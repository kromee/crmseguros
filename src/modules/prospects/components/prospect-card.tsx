"use client";

import { Calendar, Mail, Phone, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PRIORITIES } from "@/core/constants";
import { formatDate, getInitials } from "@/core/utils/format";
import type { ProspectDTO } from "../utils/serialize";

interface Props {
  prospect: ProspectDTO;
  selected: boolean;
  onSelect: () => void;
}

const PRIORITY_STYLE: Record<string, string> = {
  ATENCION: "bg-red-100 text-red-700 border-red-200",
  ALTA: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIA: "bg-blue-100 text-blue-700 border-blue-200",
  BAJA: "bg-slate-100 text-slate-600 border-slate-200",
};

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-indigo-600",
  "bg-slate-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
];

function colorForName(name: string) {
  const hash = Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function priorityLabel(value: string) {
  return PRIORITIES.find((p) => p.value === value)?.label ?? value;
}

function formatCurrencyShort(value: number) {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function healthColor(probability: number) {
  if (probability >= 75) return "bg-emerald-500";
  if (probability >= 50) return "bg-blue-500";
  if (probability >= 25) return "bg-amber-500";
  return "bg-red-500";
}

export function ProspectCard({ prospect, selected, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-white rounded-lg border p-3 transition-all hover:shadow-md ${
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-2.5 mb-2">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback
            className={`${colorForName(prospect.contact.fullName)} text-white text-xs font-semibold`}
          >
            {getInitials(prospect.contact.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {prospect.contact.fullName}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">{prospect.code}</p>
        </div>
        <span
          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
            PRIORITY_STYLE[prospect.priority] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {priorityLabel(prospect.priority)}
        </span>
      </div>

      {prospect.serviceOfInterest && (
        <p className="text-xs text-slate-600 mb-2 line-clamp-2">
          {prospect.serviceOfInterest}
        </p>
      )}

      <div className="flex items-center justify-between text-xs mb-2">
        {prospect.estimatedValue && prospect.estimatedValue > 0 ? (
          <span className="font-semibold text-slate-700">
            {formatCurrencyShort(prospect.estimatedValue)}
          </span>
        ) : (
          <span className="text-slate-400">Sin valor estimado</span>
        )}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < prospect.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Salud */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>Salud</span>
          <span className="font-semibold text-slate-600">{prospect.probability}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${healthColor(prospect.probability)}`}
            style={{ width: `${prospect.probability}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Phone className="w-2.5 h-2.5" />
          <Mail className="w-2.5 h-2.5" />
        </div>
        {prospect.nextActionDate && (
          <div className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            {formatDate(prospect.nextActionDate, "dd MMM")}
          </div>
        )}
      </div>
    </button>
  );
}
