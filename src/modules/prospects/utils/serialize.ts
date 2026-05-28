type DecimalLike = { toString(): string };

function toNumberOrNull(value: DecimalLike | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value.toString());
}

function toIso(value: Date | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

interface RawProspect {
  id: string;
  code: string;
  contactId: string;
  stage: string;
  priority: string;
  serviceOfInterest: string | null;
  estimatedValue: DecimalLike | null;
  probability: number;
  notes: string | null;
  nextActionType: string | null;
  nextActionDate: Date | null;
  rating: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  contact: {
    id: string;
    code: string;
    fullName: string;
    phone: string;
    email: string | null;
  };
  assignedUser?: { id: string; name: string } | null;
}

export function serializeProspect(p: RawProspect) {
  return {
    id: p.id,
    code: p.code,
    contactId: p.contactId,
    stage: p.stage,
    priority: p.priority,
    serviceOfInterest: p.serviceOfInterest,
    estimatedValue: toNumberOrNull(p.estimatedValue),
    probability: p.probability,
    notes: p.notes,
    nextActionType: p.nextActionType,
    nextActionDate: toIso(p.nextActionDate),
    rating: p.rating,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    contact: p.contact,
    assignedUser: p.assignedUser ?? null,
  };
}

export type ProspectDTO = ReturnType<typeof serializeProspect>;
