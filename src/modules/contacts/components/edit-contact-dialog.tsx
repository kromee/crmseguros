"use client";

import { Edit, UserCog } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ContactForm } from "./contact-form";
import type { CreateContactInput } from "../schemas/contact.schema";

interface Props {
  contactId: string;
  defaultValues: Partial<CreateContactInput>;
}

export function EditContactDialog({ contactId, defaultValues }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9"
      >
        <Edit className="w-3.5 h-3.5" />
        Editar Perfil
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-[700px] max-h-[92vh] flex flex-col p-0 gap-0"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex-shrink-0">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                  <UserCog className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Editar contacto</h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    Modifica la información del contacto
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-white/80 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <ContactForm
              mode="edit"
              contactId={contactId}
              defaultValues={defaultValues}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
