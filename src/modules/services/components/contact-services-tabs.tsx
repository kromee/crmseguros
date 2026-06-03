"use client";

import {
  Calendar,
  Car,
  Edit,
  PiggyBank,
  PlusCircle,
  RefreshCw,
  Shield,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  COVERAGE_TYPES,
  CURRENCIES,
  PAYMENT_FREQUENCIES,
  PENSION_LAWS,
  PENSION_REQUEST_TYPES,
  POLICY_STATUS_LABELS,
  POLICY_TYPES,
  VEHICLE_DOCUMENT_TYPES,
  VEHICLE_REQUEST_MODES,
  VEHICLE_SERVICE_TYPES,
} from "@/core/constants";
import { formatCurrency, formatDate } from "@/core/utils/format";
import {
  EXPIRY_BADGE_CLASS,
  getExpiryInfo,
  isPolicyClosedForFiles,
} from "@/core/utils/expiry";
import { deletePolicyAction } from "@/modules/policies/actions/policy.actions";
import { PolicyFormDialog } from "@/modules/policies/components/policy-form-dialog";
import { PolicyFileUpload } from "@/modules/policies/components/policy-file-upload";
import { PolicyVehiclePhotoUpload } from "@/modules/policies/components/policy-vehicle-photo-upload";
import { deletePensionAction } from "@/modules/pension-services/actions/pension.actions";
import { PensionFormDialog } from "@/modules/pension-services/components/pension-form-dialog";
import { deleteVehicleAction } from "@/modules/vehicle-services/actions/vehicle.actions";
import { VehicleFormDialog } from "@/modules/vehicle-services/components/vehicle-form-dialog";
import { PaymentsList, type PaymentDTO } from "@/modules/payments/components/payments-list";

type PolicyDTO = {
  id: string;
  policyNumber: string;
  type: string;
  plan: string | null;
  insurer: string | null;
  startDate: string;
  endDate: string;
  paymentFrequency: string;
  premium: number;
  sumInsured: number | null;
  beneficiaries: string | null;
  status: string;
  notes: string | null;
  insuredAsset: string | null;
  coverageType: string | null;
  vehiclePhoto: string | null;
  currency: string | null;
  term: string | null;
  policyFile: string | null;
  renewedBy: {
    id: string;
    policyNumber: string;
    status: string;
  } | null;
  payments: PaymentDTO[];
};

type PensionDTO = {
  id: string;
  requestDate: string;
  requestType: string;
  pensionLaw: string | null;
  cost: number;
  advance: number | null;
  advanceDate: string | null;
  settlement: number | null;
  settlementDate: string | null;
  description: string | null;
  bitacora: string | null;
  status: string;
};

type VehicleDTO = {
  id: string;
  startDate: string;
  serviceType: string;
  requestMode: string;
  description: string | null;
  quote: number | null;
  status: string;
  documents: {
    checklist: Record<string, boolean>;
    files: Record<string, string | null>;
  } | null;
};

interface Props {
  contactId: string;
  policies: PolicyDTO[];
  pensions: PensionDTO[];
  vehicles: VehicleDTO[];
  insurers?: readonly string[];
}

type TabId = "policies" | "pensions" | "vehicles";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-[var(--color-bg-elevated)] text-theme-secondary",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-red-100 text-red-700",
  RENEWAL: "bg-purple-100 text-purple-700",
};

function label(list: ReadonlyArray<{ value: string; label: string }>, value: string) {
  return list.find((i) => i.value === value)?.label ?? value;
}

export function ContactServicesTabs({
  contactId,
  policies,
  pensions,
  vehicles,
  insurers,
}: Props) {
  const [tab, setTab] = useState<TabId>(
    policies.length > 0
      ? "policies"
      : pensions.length > 0
        ? "pensions"
        : vehicles.length > 0
          ? "vehicles"
          : "policies"
  );

  const [policyDialog, setPolicyDialog] = useState<
    { mode: "create" } | { mode: "edit"; policy: PolicyDTO } | { mode: "renew"; policy: PolicyDTO } | null
  >(null);
  const [pensionDialog, setPensionDialog] = useState<
    { mode: "create" } | { mode: "edit"; pension: PensionDTO } | null
  >(null);
  const [vehicleDialog, setVehicleDialog] = useState<
    { mode: "create" } | { mode: "edit"; vehicle: VehicleDTO } | null
  >(null);

  async function handleDeletePolicy(id: string) {
    if (!confirm("¿Eliminar esta póliza? Esta acción no se puede deshacer.")) return;
    const res = await deletePolicyAction(id, contactId);
    if (res.ok) toast.success("Póliza eliminada");
    else toast.error(res.error);
  }

  async function handleDeletePension(id: string) {
    if (!confirm("¿Eliminar este servicio de pensión?")) return;
    const res = await deletePensionAction(id, contactId);
    if (res.ok) toast.success("Servicio eliminado");
    else toast.error(res.error);
  }

  async function handleDeleteVehicle(id: string) {
    if (!confirm("¿Eliminar este trámite vehicular?")) return;
    const res = await deleteVehicleAction(id, contactId);
    if (res.ok) toast.success("Trámite eliminado");
    else toast.error(res.error);
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <TabButton
          active={tab === "policies"}
          onClick={() => setTab("policies")}
          icon={Shield}
          label={`Seguros (${policies.length})`}
        />
        <TabButton
          active={tab === "pensions"}
          onClick={() => setTab("pensions")}
          icon={PiggyBank}
          label={`Pensiones (${pensions.length})`}
        />
        <TabButton
          active={tab === "vehicles"}
          onClick={() => setTab("vehicles")}
          icon={Car}
          label={`Vehiculares (${vehicles.length})`}
        />
        <button
          onClick={() => {
            if (tab === "policies") setPolicyDialog({ mode: "create" });
            else if (tab === "pensions") setPensionDialog({ mode: "create" });
            else setVehicleDialog({ mode: "create" });
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-bg-card)] border border-theme text-blue-600 hover:border-blue-300"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Añadir
        </button>
      </div>

      {/* Contenido del tab activo */}
      {tab === "policies" && (
        <PoliciesPanel
          policies={policies}
          onEdit={(p) => setPolicyDialog({ mode: "edit", policy: p })}
          onRenew={(p) => setPolicyDialog({ mode: "renew", policy: p })}
          onDelete={handleDeletePolicy}
        />
      )}
      {tab === "pensions" && (
        <PensionsPanel
          pensions={pensions}
          onEdit={(p) => setPensionDialog({ mode: "edit", pension: p })}
          onDelete={handleDeletePension}
        />
      )}
      {tab === "vehicles" && (
        <VehiclesPanel
          vehicles={vehicles}
          onEdit={(v) => setVehicleDialog({ mode: "edit", vehicle: v })}
          onDelete={handleDeleteVehicle}
        />
      )}

      {/* Dialogs */}
      {policyDialog && (
        <PolicyFormDialog
          open={!!policyDialog}
          onOpenChange={(o) => !o && setPolicyDialog(null)}
          mode={policyDialog.mode === "renew" ? "renew" : policyDialog.mode}
          contactId={contactId}
          policyId={
            policyDialog.mode === "edit" || policyDialog.mode === "renew"
              ? policyDialog.policy.id
              : undefined
          }
          policyFile={
            policyDialog.mode === "edit" ? policyDialog.policy.policyFile : null
          }
          vehiclePhoto={
            policyDialog.mode === "edit" ? policyDialog.policy.vehiclePhoto : null
          }
          insurers={insurers}
          filesReadOnly={
            policyDialog.mode === "edit"
              ? isPolicyClosedForFiles(
                  policyDialog.policy.status,
                  policyDialog.policy.endDate
                )
              : false
          }
          defaultValues={
            policyDialog.mode === "edit"
              ? {
                  contactId,
                  policyNumber: policyDialog.policy.policyNumber,
                  type: policyDialog.policy.type as "VIDA" | "AUTO" | "OTRO",
                  plan: policyDialog.policy.plan ?? "",
                  insurer: policyDialog.policy.insurer ?? "",
                  startDate: new Date(policyDialog.policy.startDate),
                  endDate: new Date(policyDialog.policy.endDate),
                  paymentFrequency: policyDialog.policy
                    .paymentFrequency as never,
                  premium: policyDialog.policy.premium,
                  sumInsured: policyDialog.policy.sumInsured,
                  beneficiaries: policyDialog.policy.beneficiaries ?? "",
                  status: policyDialog.policy.status as never,
                  notes: policyDialog.policy.notes ?? "",
                  insuredAsset: policyDialog.policy.insuredAsset ?? "",
                  coverageType: policyDialog.policy.coverageType as never,
                  vehiclePhoto: policyDialog.policy.vehiclePhoto ?? "",
                  currency: policyDialog.policy.currency as never,
                  term: policyDialog.policy.term ?? "",
                }
              : policyDialog.mode === "renew"
                ? (() => {
                    const old = policyDialog.policy;
                    const oldStart = new Date(old.startDate);
                    const oldEnd = new Date(old.endDate);
                    const durationMs = oldEnd.getTime() - oldStart.getTime();
                    const newStart = new Date();
                    const newEnd = new Date(newStart.getTime() + durationMs);
                    return {
                      contactId,
                      policyNumber: "",
                      type: old.type as "VIDA" | "AUTO" | "OTRO",
                      plan: old.plan ?? "",
                      insurer: old.insurer ?? "",
                      startDate: newStart,
                      endDate: newEnd,
                      paymentFrequency: old.paymentFrequency as never,
                      premium: old.premium,
                      sumInsured: old.sumInsured,
                      beneficiaries: old.beneficiaries ?? "",
                      status: "ACTIVE" as never,
                      notes: "",
                      insuredAsset: old.insuredAsset ?? "",
                      coverageType: old.coverageType as never,
                      currency: old.currency as never,
                      term: old.term ?? "",
                    };
                  })()
                : undefined
          }
        />
      )}

      {pensionDialog && (
        <PensionFormDialog
          open={!!pensionDialog}
          onOpenChange={(o) => !o && setPensionDialog(null)}
          mode={pensionDialog.mode}
          contactId={contactId}
          pensionId={pensionDialog.mode === "edit" ? pensionDialog.pension.id : undefined}
          defaultValues={
            pensionDialog.mode === "edit"
              ? {
                  contactId,
                  requestDate: new Date(pensionDialog.pension.requestDate),
                  requestType: pensionDialog.pension.requestType as never,
                  pensionLaw: pensionDialog.pension.pensionLaw as never,
                  cost: pensionDialog.pension.cost,
                  advance: pensionDialog.pension.advance,
                  advanceDate: pensionDialog.pension.advanceDate
                    ? new Date(pensionDialog.pension.advanceDate)
                    : null,
                  settlement: pensionDialog.pension.settlement,
                  settlementDate: pensionDialog.pension.settlementDate
                    ? new Date(pensionDialog.pension.settlementDate)
                    : null,
                  description: pensionDialog.pension.description ?? "",
                  bitacora: pensionDialog.pension.bitacora ?? "",
                  status: pensionDialog.pension.status as never,
                }
              : undefined
          }
        />
      )}

      {vehicleDialog && (
        <VehicleFormDialog
          open={!!vehicleDialog}
          onOpenChange={(o) => !o && setVehicleDialog(null)}
          mode={vehicleDialog.mode}
          contactId={contactId}
          vehicleId={vehicleDialog.mode === "edit" ? vehicleDialog.vehicle.id : undefined}
          defaultValues={
            vehicleDialog.mode === "edit"
              ? {
                  contactId,
                  startDate: new Date(vehicleDialog.vehicle.startDate),
                  serviceType: vehicleDialog.vehicle.serviceType as never,
                  requestMode: vehicleDialog.vehicle.requestMode as never,
                  description: vehicleDialog.vehicle.description ?? "",
                  quote: vehicleDialog.vehicle.quote,
                  status: vehicleDialog.vehicle.status as never,
                  documentChecklist: (vehicleDialog.vehicle.documents?.checklist ?? {
                    ine: false,
                    tarjetaCirculacion: false,
                    factura: false,
                    titulo: false,
                  }) as { ine: boolean; tarjetaCirculacion: boolean; factura: boolean; titulo: boolean },
                  documentFiles: (vehicleDialog.vehicle.documents?.files ??
                    {}) as {
                      ine?: string | null;
                      tarjetaCirculacion?: string | null;
                      factura?: string | null;
                      titulo?: string | null;
                    },
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Shield;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-[var(--color-bg-card)] border border-theme text-theme-secondary hover:border-blue-300"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof Shield; message: string }) {
  return (
    <div className="crm-card p-8 text-center">
      <Icon className="w-10 h-10 text-theme-muted/50 mx-auto mb-3" />
      <p className="text-sm text-theme-muted">{message}</p>
    </div>
  );
}

function getEffectiveStatus(policy: PolicyDTO): { status: string; expiry: ReturnType<typeof getExpiryInfo> } {
  const expiry = getExpiryInfo(policy.endDate);
  if (policy.status === "ACTIVE" && expiry && expiry.level === "expired") {
    return { status: "EXPIRED", expiry };
  }
  return { status: policy.status, expiry };
}

function PoliciesPanel({
  policies,
  onEdit,
  onRenew,
  onDelete,
}: {
  policies: PolicyDTO[];
  onEdit: (p: PolicyDTO) => void;
  onRenew: (p: PolicyDTO) => void;
  onDelete: (id: string) => void;
}) {
  if (policies.length === 0) {
    return <EmptyState icon={Shield} message="Este contacto no tiene pólizas registradas." />;
  }

  return (
    <div className="space-y-3">
      {policies.map((p) => {
        const { status: effectiveStatus, expiry } = getEffectiveStatus(p);
        const filesReadOnly = isPolicyClosedForFiles(p.status, p.endDate);
        return (
          <div key={p.id} className="crm-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-theme-primary">
                    {label(POLICY_TYPES, p.type)}
                    {p.plan ? ` · ${p.plan}` : ""}
                  </h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      STATUS_BADGE[effectiveStatus] ?? "bg-[var(--color-bg-elevated)] text-theme-secondary"
                    }`}
                  >
                    {POLICY_STATUS_LABELS[effectiveStatus] ?? effectiveStatus}
                  </span>
                  {expiry && effectiveStatus !== "CANCELLED" && expiry.level !== "ok" && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${EXPIRY_BADGE_CLASS[expiry.level]}`}
                    >
                      {expiry.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-theme-muted font-mono">
                  {p.policyNumber}
                  {p.insurer ? ` · ${p.insurer}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                {!p.renewedBy && (effectiveStatus === "EXPIRED" || (expiry && (expiry.level === "critical" || expiry.level === "warning"))) && (
                  <button
                    onClick={() => onRenew(p)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    title="Renovar póliza"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Renovar
                  </button>
                )}
                <button
                  onClick={() => onEdit(p)}
                  className="p-1.5 hover:bg-[var(--color-bg-hover)] rounded text-theme-muted"
                  title="Editar"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  className="p-1.5 hover:bg-red-50 rounded text-red-500"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <Field
                label="Vigencia"
                value={`${formatDate(p.startDate, "dd MMM yyyy")} → ${formatDate(p.endDate, "dd MMM yyyy")}`}
              />
              <Field label="Forma de pago" value={label(PAYMENT_FREQUENCIES, p.paymentFrequency)} />
              <Field label="Prima" value={formatCurrency(p.premium)} />
              <Field
                label="Suma asegurada"
                value={p.sumInsured ? formatCurrency(p.sumInsured) : "—"}
              />
            </div>

            {p.type === "AUTO" && (
              <div className="mt-3 pt-3 border-t border-theme-subtle space-y-3">
                {(p.insuredAsset || p.coverageType) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {p.insuredAsset && <Field label="Bien asegurado" value={p.insuredAsset} />}
                    {p.coverageType && (
                      <Field label="Cobertura" value={label(COVERAGE_TYPES, p.coverageType)} />
                    )}
                  </div>
                )}
                <PolicyVehiclePhotoUpload
                  policyId={p.id}
                  vehiclePhoto={p.vehiclePhoto}
                  readOnly={filesReadOnly}
                />
              </div>
            )}

            {p.type === "VIDA" && (p.currency || p.term) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mt-3 pt-3 border-t border-theme-subtle">
                {p.currency && <Field label="Moneda" value={label(CURRENCIES, p.currency)} />}
                {p.term && <Field label="Plazo" value={p.term} />}
              </div>
            )}

            {p.beneficiaries && (
              <p className="text-xs text-theme-muted mt-3">
                <span className="font-semibold text-theme-secondary">Beneficiarios:</span>{" "}
                {p.beneficiaries}
              </p>
            )}

            {/* Documento de póliza (PDF / imagen) */}
            <div className="mt-3 pt-3 border-t border-theme-subtle">
              <p className="text-xs font-semibold text-theme-muted uppercase tracking-wide mb-2">
                Archivo de póliza
              </p>
              <PolicyFileUpload
                policyId={p.id}
                policyFile={p.policyFile}
                readOnly={filesReadOnly}
              />
            </div>

            {/* Pagos */}
            <div className="mt-3 pt-3 border-t border-theme-subtle">
              <PaymentsList
                policyId={p.id}
                policyNumber={p.policyNumber}
                payments={p.payments}
                totalPaid={p.payments.filter((pm) => pm.status === "CONFIRMED").reduce((sum, pm) => sum + pm.amount, 0)}
                premium={p.premium}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PensionsPanel({
  pensions,
  onEdit,
  onDelete,
}: {
  pensions: PensionDTO[];
  onEdit: (p: PensionDTO) => void;
  onDelete: (id: string) => void;
}) {
  if (pensions.length === 0) {
    return (
      <EmptyState
        icon={PiggyBank}
        message="Este contacto no tiene asesorías o trámites de pensión."
      />
    );
  }

  return (
    <div className="space-y-3">
      {pensions.map((p) => (
        <div key={p.id} className="crm-card p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PiggyBank className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-theme-primary">
                  {label(PENSION_REQUEST_TYPES, p.requestType)}
                  {p.pensionLaw ? ` · ${label(PENSION_LAWS, p.pensionLaw)}` : ""}
                </h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    STATUS_BADGE[p.status] ?? "bg-[var(--color-bg-elevated)] text-theme-secondary"
                  }`}
                >
                  {STATUS_LABELS[p.status]}
                </span>
              </div>
              <p className="text-xs text-theme-muted">
                Solicitado: {formatDate(p.requestDate, "dd MMM yyyy")}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(p)}
                className="p-1.5 hover:bg-[var(--color-bg-hover)] rounded text-theme-muted"
                title="Editar"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="p-1.5 hover:bg-red-50 rounded text-red-500"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <Field label="Costo" value={formatCurrency(p.cost)} />
            <Field
              label="Anticipo"
              value={
                p.advance
                  ? `${formatCurrency(p.advance)}${p.advanceDate ? ` · ${formatDate(p.advanceDate, "dd MMM")}` : ""}`
                  : "—"
              }
            />
            <Field
              label="Liquidación"
              value={
                p.settlement
                  ? `${formatCurrency(p.settlement)}${p.settlementDate ? ` · ${formatDate(p.settlementDate, "dd MMM")}` : ""}`
                  : "—"
              }
            />
          </div>

          {p.description && (
            <p className="text-xs text-theme-secondary mt-3">{p.description}</p>
          )}
          {p.bitacora && (
            <div className="mt-3 p-3 rounded-lg bg-[var(--color-bg-input)] text-xs text-theme-secondary whitespace-pre-wrap">
              <span className="block text-[10px] font-semibold text-theme-muted mb-1 uppercase tracking-wide">
                Bitácora
              </span>
              {p.bitacora}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VehiclesPanel({
  vehicles,
  onEdit,
  onDelete,
}: {
  vehicles: VehicleDTO[];
  onEdit: (v: VehicleDTO) => void;
  onDelete: (id: string) => void;
}) {
  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={Car}
        message="Este contacto no tiene trámites vehiculares registrados."
      />
    );
  }

  return (
    <div className="space-y-3">
      {vehicles.map((v) => (
        <div key={v.id} className="crm-card p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-theme-primary">
                  {label(VEHICLE_SERVICE_TYPES, v.serviceType)}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                  {label(VEHICLE_REQUEST_MODES, v.requestMode)}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    STATUS_BADGE[v.status] ?? "bg-[var(--color-bg-elevated)] text-theme-secondary"
                  }`}
                >
                  {STATUS_LABELS[v.status]}
                </span>
              </div>
              <p className="text-xs text-theme-muted flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Inicio: {formatDate(v.startDate, "dd MMM yyyy")}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(v)}
                className="p-1.5 hover:bg-[var(--color-bg-hover)] rounded text-theme-muted"
                title="Editar"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(v.id)}
                className="p-1.5 hover:bg-red-50 rounded text-red-500"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Field
              label="Cotización"
              value={v.quote ? formatCurrency(v.quote) : "Sin cotizar"}
            />
            <Field label="Estado" value={STATUS_LABELS[v.status]} />
          </div>

          {v.documents && Object.keys(v.documents.checklist ?? {}).length > 0 && (
            <div className="mt-3 pt-3 border-t border-theme-subtle">
              <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wide mb-2">
                Documentos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VEHICLE_DOCUMENT_TYPES.map((doc) => {
                  const received = v.documents?.checklist?.[doc.key] ?? false;
                  const filePath = v.documents?.files?.[doc.key] ?? null;
                  return (
                    <span
                      key={doc.key}
                      className={`text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1 ${
                        received
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-[var(--color-bg-input)] text-theme-muted border border-theme-subtle"
                      }`}
                    >
                      {received ? "✓" : "○"} {doc.label}
                      {filePath && (
                        <a
                          href={`/api/files/${filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver
                        </a>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {v.description && (
            <p className="text-xs text-theme-secondary mt-3">{v.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-theme-secondary">{value}</p>
    </div>
  );
}
