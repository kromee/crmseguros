import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition-all outline-none border border-transparent resize-y placeholder:text-slate-400 hover:bg-slate-100/80 focus-visible:bg-white focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:bg-red-50 aria-invalid:border-red-300 aria-invalid:ring-[3px] aria-invalid:ring-red-500/10",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
