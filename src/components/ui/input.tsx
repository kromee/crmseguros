import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800 transition-all outline-none border border-transparent placeholder:text-slate-400 hover:bg-slate-100/80 focus-visible:bg-white focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-500/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:bg-red-50 aria-invalid:border-red-300 aria-invalid:ring-[3px] aria-invalid:ring-red-500/10 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-700",
        className
      )}
      {...props}
    />
  )
}

export { Input }
