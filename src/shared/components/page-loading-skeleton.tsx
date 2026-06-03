import { Skeleton } from "@/components/ui/skeleton";

type Variant = "default" | "table" | "dashboard" | "kanban" | "calendar" | "services";

export function PageLoadingSkeleton({ variant = "default" }: { variant?: Variant }) {
  if (variant === "dashboard") {
    return (
      <div className="space-y-5 crm-loading-stagger">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-5 crm-loading-stagger">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-36 rounded-lg flex-shrink-0" />
        </div>
        <div className="flex gap-5">
          <Skeleton className="hidden md:block w-52 h-72 rounded-xl flex-shrink-0" />
          <div className="flex-1 crm-card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-theme-subtle">
              <Skeleton className="h-7 w-32 rounded-full" />
              <Skeleton className="h-9 flex-1 max-w-sm rounded-lg" />
            </div>
            <div className="divide-y divide-theme-subtle">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20 hidden sm:block" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "kanban") {
    return (
      <div className="space-y-5 crm-loading-stagger">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, col) => (
            <div key={col} className="crm-card p-3 space-y-3 min-h-[320px]">
              <Skeleton className="h-5 w-28" />
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "calendar") {
    return (
      <div className="space-y-5 crm-loading-stagger">
        <div className="flex items-center gap-3 flex-wrap">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-32 ml-auto rounded-lg" />
        </div>
        <div className="crm-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-theme-subtle">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 m-1 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="min-h-[90px] m-0.5 rounded-none" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "services") {
    return (
      <div className="space-y-5 crm-loading-stagger">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-xl" />
          ))}
        </div>
        <div className="crm-card overflow-hidden">
          <Skeleton className="h-14 w-full rounded-none" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-none border-t border-theme-subtle" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 crm-loading-stagger">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}
