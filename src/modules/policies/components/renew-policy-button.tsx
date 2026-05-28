"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { PolicyFormDialog } from "./policy-form-dialog";
import type { CreatePolicyInput } from "../schemas/policy.schema";

interface Props {
  policyId: string;
  contactId: string;
  defaultValues: Partial<CreatePolicyInput>;
}

export function RenewPolicyButton({ policyId, contactId, defaultValues }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
        title="Renovar póliza"
      >
        <RefreshCw className="w-3 h-3" />
        Renovar
      </button>
      <PolicyFormDialog
        open={open}
        onOpenChange={setOpen}
        mode="renew"
        contactId={contactId}
        policyId={policyId}
        defaultValues={defaultValues}
      />
    </>
  );
}
