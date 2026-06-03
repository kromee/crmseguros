import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-2 text-sm text-[var(--color-text-primary)] transition-all outline-none placeholder:text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] focus-visible:border-blue-500 focus-visible:bg-[var(--color-bg-card)] focus-visible:ring-[3px] focus-visible:ring-blue-500/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:bg-red-50 aria-invalid:border-red-300 aria-invalid:ring-[3px] aria-invalid:ring-red-500/10 dark:aria-invalid:bg-red-950/30 dark:aria-invalid:border-red-800 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--color-text-secondary)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
