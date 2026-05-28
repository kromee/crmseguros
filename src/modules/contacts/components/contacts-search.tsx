"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ContactsSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("search") ?? "");

  useEffect(() => {
    const id = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("search", value.trim());
      else next.delete("search");
      next.delete("page");
      if (next.toString() !== params.toString()) {
        router.push(`/contacts?${next.toString()}`);
      }
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        placeholder="Buscar por nombre, teléfono, correo o código..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm"
      />
    </div>
  );
}
