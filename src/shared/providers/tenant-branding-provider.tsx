"use client";

import { createContext, useContext } from "react";
import type { TenantBranding } from "@/core/tenant/branding-types";
import { DEFAULT_TENANT_SLOGAN, formatDisplaySlogan } from "@/core/tenant/branding-types";

const TenantBrandingContext = createContext<TenantBranding | null>(null);

export function TenantBrandingProvider({
  branding,
  children,
}: {
  branding: TenantBranding;
  children: React.ReactNode;
}) {
  return (
    <TenantBrandingContext.Provider value={branding}>{children}</TenantBrandingContext.Provider>
  );
}

export function useTenantBranding(): TenantBranding {
  const ctx = useContext(TenantBrandingContext);
  if (!ctx) {
    return {
      tenantId: "",
      name: "CRM Seguros",
      logo: null,
      slogan: DEFAULT_TENANT_SLOGAN,
    };
  }
  return ctx;
}

export function useTenantDisplaySlogan(): string {
  const { slogan } = useTenantBranding();
  return formatDisplaySlogan(slogan);
}
