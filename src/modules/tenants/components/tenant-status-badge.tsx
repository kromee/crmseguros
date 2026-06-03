import type { TenantStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { TENANT_STATUS_LABELS } from "@/core/tenant/labels";
import { cn } from "@/lib/utils";

const variantMap: Record<TenantStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PENDING: "outline",
  SUSPENDED: "destructive",
};

export function TenantStatusBadge({
  status,
  className,
}: {
  status: TenantStatus;
  className?: string;
}) {
  return (
    <Badge variant={variantMap[status]} className={cn(className)}>
      {TENANT_STATUS_LABELS[status]}
    </Badge>
  );
}
