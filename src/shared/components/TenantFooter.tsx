"use client";

import { useTenantBranding, useTenantDisplaySlogan } from "@/shared/providers/tenant-branding-provider";

export function TenantFooter() {
  const { name } = useTenantBranding();
  const slogan = useTenantDisplaySlogan();
  const year = new Date().getFullYear();

  return (
    <footer className="text-center py-4 text-xs text-theme-muted border-t border-theme-subtle">
      <span className="font-semibold text-theme-secondary">{name}</span> © {year}
      {slogan && (
        <>
          {" · "}
          {slogan}
        </>
      )}
    </footer>
  );
}
