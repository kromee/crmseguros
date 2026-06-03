import type { LicenseTerm } from "@prisma/client";

/** Etiquetas comerciales de vigencia de licencia / suscripción */
export const LICENSE_TERM_LABELS: Record<LicenseTerm, string> = {
  MONTHLY: "Mensual (1 mes)",
  ANNUAL: "Anual (12 meses)",
  MONTHS_24: "24 meses",
  YEARS_4: "4 años",
};

/** Calcula fecha de fin según término, desde una fecha de inicio */
export function expiresAtFromTerm(startsAt: Date, term: LicenseTerm): Date {
  const end = new Date(startsAt);
  switch (term) {
    case "MONTHLY":
      end.setMonth(end.getMonth() + 1);
      break;
    case "ANNUAL":
      end.setFullYear(end.getFullYear() + 1);
      break;
    case "MONTHS_24":
      end.setMonth(end.getMonth() + 24);
      break;
    case "YEARS_4":
      end.setFullYear(end.getFullYear() + 4);
      break;
    default: {
      const _exhaustive: never = term;
      return _exhaustive;
    }
  }
  return end;
}
