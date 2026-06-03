import { CONTACT_ORIGINS, INSURERS } from "@/core/constants";

export type ContactOriginCatalogItem = {
  value: string;
  label: string;
  enabled: boolean;
};

export type TenantCatalogSettings = {
  insurers: string[];
  contactOrigins: ContactOriginCatalogItem[];
};

export function defaultCatalogSettings(): TenantCatalogSettings {
  return {
    insurers: [...INSURERS],
    contactOrigins: CONTACT_ORIGINS.map((o) => ({
      value: o.value,
      label: o.label,
      enabled: true,
    })),
  };
}

export function parseCatalogSettings(raw: unknown): TenantCatalogSettings {
  const defaults = defaultCatalogSettings();
  if (!raw || typeof raw !== "object") return defaults;

  const data = raw as Partial<TenantCatalogSettings>;
  const insurers =
    Array.isArray(data.insurers) && data.insurers.every((i) => typeof i === "string")
      ? data.insurers.map((i) => i.trim()).filter(Boolean)
      : defaults.insurers;

  const contactOrigins =
    Array.isArray(data.contactOrigins) &&
    data.contactOrigins.every(
      (o) =>
        o &&
        typeof o === "object" &&
        typeof (o as ContactOriginCatalogItem).value === "string" &&
        typeof (o as ContactOriginCatalogItem).label === "string"
    )
      ? data.contactOrigins.map((o) => ({
          value: o.value,
          label: o.label.trim() || o.value,
          enabled: o.enabled !== false,
        }))
      : defaults.contactOrigins;

  return { insurers: insurers.length ? insurers : defaults.insurers, contactOrigins };
}

export function enabledContactOrigins(settings: TenantCatalogSettings) {
  return settings.contactOrigins.filter((o) => o.enabled);
}

export function contactOriginLabel(settings: TenantCatalogSettings, value: string) {
  return (
    settings.contactOrigins.find((o) => o.value === value)?.label ??
    CONTACT_ORIGINS.find((o) => o.value === value)?.label ??
    value
  );
}
