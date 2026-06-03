"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EventFormDialog } from "./event-form-dialog";

interface ContactOption {
  id: string;
  code: string;
  fullName: string;
}

interface UserOption {
  id: string;
  name: string;
}

interface Props {
  contacts: ContactOption[];
  users: UserOption[];
  currentUserId: string;
  className?: string;
  label?: string;
}

export function NewEventButton({
  contacts,
  users,
  currentUserId,
  className = "bg-blue-600 hover:bg-blue-700 text-white",
  label = "+ Programar nuevo evento",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={`w-full text-sm h-9 ${className}`}
      >
        {label}
      </Button>

      <EventFormDialog
        open={open}
        onOpenChange={setOpen}
        mode="create"
        contacts={contacts}
        users={users}
        currentUserId={currentUserId}
      />
    </>
  );
}
