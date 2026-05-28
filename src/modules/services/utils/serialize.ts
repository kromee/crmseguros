// Tipo estructural mínimo para representar Decimal de Prisma sin acoplar al import interno.
type DecimalLike = { toString(): string };

function toNumberOrNull(value: DecimalLike | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value.toString());
}

function toNumber(value: DecimalLike): number {
  return Number(value.toString());
}

function toIso(value: Date | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

interface RawPayment {
  id: string;
  amount: DecimalLike;
  paymentDate: Date;
  periodStart: Date | null;
  periodEnd: Date | null;
  method: string;
  reference: string | null;
  notes: string | null;
  status: string;
}

interface RawPolicy {
  id: string;
  policyNumber: string;
  type: string;
  plan: string | null;
  insurer: string | null;
  startDate: Date;
  endDate: Date;
  paymentFrequency: string;
  premium: DecimalLike;
  sumInsured: DecimalLike | null;
  beneficiaries: string | null;
  status: string;
  notes: string | null;
  insuredAsset: string | null;
  coverageType: string | null;
  vehiclePhoto: string | null;
  currency: string | null;
  term: string | null;
  policyFile: string | null;
  renewedBy?: {
    id: string;
    policyNumber: string;
    status: string;
  } | null;
  payments?: RawPayment[];
}

interface RawPension {
  id: string;
  requestDate: Date;
  requestType: string;
  pensionLaw: string | null;
  cost: DecimalLike;
  advance: DecimalLike | null;
  advanceDate: Date | null;
  settlement: DecimalLike | null;
  settlementDate: Date | null;
  description: string | null;
  bitacora: string | null;
  status: string;
}

interface RawVehicle {
  id: string;
  startDate: Date;
  serviceType: string;
  requestMode: string;
  description: string | null;
  quote: DecimalLike | null;
  status: string;
  documents: unknown;
}

function serializePayment(pm: RawPayment) {
  return {
    id: pm.id,
    amount: toNumber(pm.amount),
    paymentDate: toIso(pm.paymentDate)!,
    periodStart: toIso(pm.periodStart),
    periodEnd: toIso(pm.periodEnd),
    method: pm.method,
    reference: pm.reference,
    notes: pm.notes,
    status: pm.status,
  };
}

export function serializePolicy(p: RawPolicy) {
  return {
    id: p.id,
    policyNumber: p.policyNumber,
    type: p.type,
    plan: p.plan,
    insurer: p.insurer,
    startDate: toIso(p.startDate)!,
    endDate: toIso(p.endDate)!,
    paymentFrequency: p.paymentFrequency,
    premium: toNumber(p.premium),
    sumInsured: toNumberOrNull(p.sumInsured),
    beneficiaries: p.beneficiaries,
    status: p.status,
    notes: p.notes,
    insuredAsset: p.insuredAsset,
    coverageType: p.coverageType,
    vehiclePhoto: p.vehiclePhoto,
    currency: p.currency,
    term: p.term,
    policyFile: p.policyFile,
    renewedBy: p.renewedBy
      ? {
          id: p.renewedBy.id,
          policyNumber: p.renewedBy.policyNumber,
          status: p.renewedBy.status,
        }
      : null,
    payments: (p.payments ?? []).map(serializePayment),
  };
}

export function serializePension(p: RawPension) {
  return {
    id: p.id,
    requestDate: toIso(p.requestDate)!,
    requestType: p.requestType,
    pensionLaw: p.pensionLaw,
    cost: toNumber(p.cost),
    advance: toNumberOrNull(p.advance),
    advanceDate: toIso(p.advanceDate),
    settlement: toNumberOrNull(p.settlement),
    settlementDate: toIso(p.settlementDate),
    description: p.description,
    bitacora: p.bitacora,
    status: p.status,
  };
}

export function serializeVehicle(v: RawVehicle) {
  const rawDocs = (v.documents as {
    checklist?: Record<string, boolean>;
    files?: Record<string, string | null>;
  } | null) ?? null;
  const isLegacy = rawDocs && !("checklist" in rawDocs);

  return {
    id: v.id,
    startDate: toIso(v.startDate)!,
    serviceType: v.serviceType,
    requestMode: v.requestMode,
    description: v.description,
    quote: toNumberOrNull(v.quote),
    status: v.status,
    documents: isLegacy
      ? {
          checklist: rawDocs as Record<string, boolean>,
          files: {},
        }
      : {
          checklist: rawDocs?.checklist ?? {},
          files: rawDocs?.files ?? {},
        },
  };
}
