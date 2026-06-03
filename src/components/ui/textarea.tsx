import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] transition-all outline-none resize-y placeholder:text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] focus-visible:border-blue-500 focus-visible:bg-[var(--color-bg-card)] focus-visible:ring-[3px] focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:bg-red-50 aria-invalid:border-red-300 aria-invalid:ring-[3px] aria-invalid:ring-red-500/10 dark:aria-invalid:bg-red-950/30 dark:aria-invalid:border-red-800",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
