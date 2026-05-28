"use client";

import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ActivityFormDialog } from "./activity-form-dialog";

interface Props {
  contactId: string;
  variant?: "primary" | "outline";
  label?: string;
}

export function NewActivityButton({
  contactId,
  variant = "primary",
  label = "Nueva entrada",
}: Props) {
  const [open, setOpen] = useState(false);

  const className =
    variant === "primary"
      ? "bg-blue-600 hover:bg-blue-700 text-white gap-2"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-2";

  return (
    <>
      <Button onClick={() => setOpen(true)} className={className} size="sm">
        <PlusCircle className="w-4 h-4" />
        {label}
      </Button>
      <ActivityFormDialog
        open={open}
        onOpenChange={setOpen}
        mode="create"
        contactId={contactId}
      />
    </>
  );
}
