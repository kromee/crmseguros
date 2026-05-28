import {
  AlertTriangle,
  Calendar,
  Car,
  PiggyBank,
  Shield,
} from "lucide-react";
import Link from "next/link";
import {
  PAYMENT_FREQUENCIES,
  PENSION_LAWS,
  PENSION_REQUEST_TYPES,
  POLICY_STATUS_LABELS,
  POLICY_TYPES,
  VEHICLE_SERVICE_TYPES,
} from "@/core/constants";
import {
  EXPIRY_BADGE_CLASS,
  getExpiryInfo,
} from "@/core/utils/expiry";
import { formatCurrency, formatDate } from "@/core/utils/format";
import { RenewPolicyButton } from "@/modules/policies/components/renew-policy-button";
import { pensionService } from "@/modules/pension-services/services/pension.service";
import { pensionsFiltersSchema } from "@/modules/pension-services/schemas/pension.schema";
import { policyService } from "@/modules/policies/services/policy.service";
import { policiesFiltersSchema } from "@/modules/policies/schemas/policy.schema";
import { servicesAggregator } from "@/modules/services/services/aggregator.service";
import { vehicleService } from "@/modules/vehicle-services/services/vehicle.service";
import { vehiclesFiltersSchema } from "@/modules/vehicle-services/schemas/vehicle.schema";

export const dynamic = "force-dynamic";

type Tab = "policies" | "pensions" | "vehicles";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

const TAB_LABEL: Record<Tab, string> = {
  policies: "Seguros",
  pensions: "Pensiones",
  vehicles: "Vehiculares",
};

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
  CANCELLED: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-red-100 text-red-700",
  RENEWAL: "bg-purple-100 text-purple-700",
};

function buildHref(searchParams: URLSearchParams, overrides: Record<string, string | null>) {
  const next = new URLSearchParams(searchParams);
  Object.entries(overrides).forEach(([k, v]) => {
    if (v === null) next.delete(k);
    else next.set(k, v);
  });
  return `/services?${next.toString()}`;
}

function label(list: ReadonlyArray<{ value: string; label: string }>, value: string) {
  return list.find((i) => i.value === value)?.label ?? value;
}

export default async function ServicesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab: Tab = (params.tab as Tab) ?? "policies";
  const overview = await servicesAggregator.getOverview();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Servicios</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Seguros, asesorías de pensión y trámites vehiculares
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Shield}
          label="Pólizas activas"
          value={overview.policies.active}
          accent="text-blue-600"
          bg="bg-blue-50"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Vencen en 30 días"
          value={overview.policies.expiring30d}
          accent="text-amber-600"
          bg="bg-amber-50"
        />
        <KpiCard
          icon={PiggyBank}
          label="Pensiones activas"
          value={overview.pensions.active}
          accent="text-purple-600"
          bg="bg-purple-50"
        />
        <KpiCard
          icon={Car}
          label="Trámites en proceso"
          value={overview.vehicles.inProgress}
          accent="text-emerald-600"
          bg="bg-emerald-50"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["policies", "pensions", "vehicles"] as Tab[]).map((t) => {
          const active = tab === t;
          const Icon = t === "policies" ? Shield : t === "pensions" ? PiggyBank : Car;
          return (
            <Link
              key={t}
              href={buildHref(new URLSearchParams(), { tab: t })}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {TAB_LABEL[t]}
            </Link>
          );
        })}
      </div>

      {/* Panel del tab */}
      {tab === "policies" && <PoliciesPanel searchParams={params} />}
      {tab === "pensions" && <PensionsPanel searchParams={params} />}
      {tab === "vehicles" && <VehiclesPanel searchParams={params} />}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: typeof Shield;
  label: string;
  value: number;
  accent: string;
  bg: string;
}) {
  return (
    <div className="crm-card p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-5 h-5 ${accent}`} />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

async function PoliciesPanel({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const filters = policiesFiltersSchema.parse({
    type: searchParams.type,
    status: searchParams.status,
    search: searchParams.search,
    page: searchParams.page ?? "1",
    pageSize: "10",
  });
  const list = await policyService.list(filters);

  return (
    <div className="crm-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          {list.total} pólizas
        </span>
        <form className="flex gap-2 ml-auto" method="get">
          <input type="hidden" name="tab" value="policies" />
          <input
            name="search"
            defaultValue={searchParams.search ?? ""}
            placeholder="Buscar..."
            className="h-9 px-3 text-sm border border-slate-200 rounded-md bg-slate-50"
          />
          <select
            name="type"
            defaultValue={searchParams.type ?? ""}
            className="crm-select max-w-[180px]"
          >
            <option value="">Todos los tipos</option>
            {POLICY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="crm-select max-w-[180px]"
          >
            <option value="">Todos los estados</option>
            {Object.entries(POLICY_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <button className="h-9 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Filtrar
          </button>
        </form>
      </div>

      {list.items.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-400">
          No hay pólizas con los filtros actuales.
        </div>
      ) : (
        <table className="w-full crm-table">
          <thead>
            <tr>
              {["Póliza", "Cliente", "Tipo", "Vigencia", "Prima", "Estado"].map((h) => (
                <th key={h} className="text-left px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.items.map((p) => {
              const expiry = getExpiryInfo(p.endDate);
              const effectiveStatus =
                p.status === "ACTIVE" && expiry?.level === "expired"
                  ? "EXPIRED"
                  : p.status;
              return (
                <tr key={p.id} className="border-t border-slate-50">
                  <td className="px-5 py-3">
                    <p className="text-sm font-mono text-slate-700">{p.policyNumber}</p>
                    {p.plan && <p className="text-xs text-slate-400">{p.plan}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/contacts/${p.contact.id}`}
                      className="text-sm font-semibold text-slate-800 hover:text-blue-600"
                    >
                      {p.contact.fullName}
                    </Link>
                    <p className="text-xs text-slate-400 font-mono">{p.contact.code}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {label(POLICY_TYPES, p.type)}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-slate-700">
                      {formatDate(p.endDate, "dd MMM yyyy")}
                    </p>
                    {expiry && effectiveStatus !== "CANCELLED" && expiry.level !== "ok" && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${EXPIRY_BADGE_CLASS[expiry.level]}`}
                      >
                        {expiry.label}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-700">
                    {formatCurrency(Number(p.premium.toString()))}
                    <p className="text-xs text-slate-400">
                      {label(PAYMENT_FREQUENCIES, p.paymentFrequency)}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          STATUS_BADGE[effectiveStatus] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {POLICY_STATUS_LABELS[effectiveStatus] ?? effectiveStatus}
                      </span>
                      {!p.renewedBy && (effectiveStatus === "EXPIRED" || (expiry && (expiry.level === "critical" || expiry.level === "warning"))) && (() => {
                        const oldStart = new Date(p.startDate);
                        const oldEnd = new Date(p.endDate);
                        const durationMs = oldEnd.getTime() - oldStart.getTime();
                        const newStart = new Date();
                        const newEnd = new Date(newStart.getTime() + durationMs);
                        return (
                          <RenewPolicyButton
                            policyId={p.id}
                            contactId={p.contact.id}
                            defaultValues={{
                              contactId: p.contact.id,
                              policyNumber: "",
                              type: p.type as "VIDA" | "AUTO" | "OTRO",
                              plan: p.plan ?? "",
                              insurer: p.insurer ?? "",
                              startDate: newStart,
                              endDate: newEnd,
                              paymentFrequency: p.paymentFrequency as never,
                              premium: Number(p.premium.toString()),
                              sumInsured: p.sumInsured ? Number(p.sumInsured.toString()) : null,
                              beneficiaries: p.beneficiaries ?? "",
                              status: "ACTIVE" as never,
                              notes: "",
                              insuredAsset: p.insuredAsset ?? "",
                              coverageType: p.coverageType as never,
                              currency: p.currency as never,
                              term: p.term ?? "",
                            }}
                          />
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <ServerPagination
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        pageSize={list.pageSize}
        baseParams={{ tab: "policies", ...searchParams }}
      />
    </div>
  );
}

async function PensionsPanel({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const filters = pensionsFiltersSchema.parse({
    status: searchParams.status,
    requestType: searchParams.requestType,
    search: searchParams.search,
    page: searchParams.page ?? "1",
    pageSize: "10",
  });
  const list = await pensionService.list(filters);

  return (
    <div className="crm-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
          {list.total} pensiones
        </span>
        <form className="flex gap-2 ml-auto" method="get">
          <input type="hidden" name="tab" value="pensions" />
          <input
            name="search"
            defaultValue={searchParams.search ?? ""}
            placeholder="Buscar..."
            className="h-9 px-3 text-sm border border-slate-200 rounded-md bg-slate-50"
          />
          <select
            name="requestType"
            defaultValue={searchParams.requestType ?? ""}
            className="crm-select max-w-[180px]"
          >
            <option value="">Todos los tipos</option>
            {PENSION_REQUEST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="crm-select max-w-[180px]"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <button className="h-9 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Filtrar
          </button>
        </form>
      </div>

      {list.items.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-400">
          No hay servicios de pensión.
        </div>
      ) : (
        <table className="w-full crm-table">
          <thead>
            <tr>
              {["Cliente", "Tipo", "Ley", "Solicitud", "Costo", "Estado"].map((h) => (
                <th key={h} className="text-left px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.items.map((p) => (
              <tr key={p.id} className="border-t border-slate-50">
                <td className="px-5 py-3">
                  <Link
                    href={`/contacts/${p.contact.id}`}
                    className="text-sm font-semibold text-slate-800 hover:text-blue-600"
                  >
                    {p.contact.fullName}
                  </Link>
                  <p className="text-xs text-slate-400 font-mono">{p.contact.code}</p>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">
                  {label(PENSION_REQUEST_TYPES, p.requestType)}
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">
                  {p.pensionLaw ? label(PENSION_LAWS, p.pensionLaw) : "—"}
                </td>
                <td className="px-5 py-3 text-sm text-slate-700">
                  {formatDate(p.requestDate, "dd MMM yyyy")}
                </td>
                <td className="px-5 py-3 text-sm text-slate-700">
                  {formatCurrency(Number(p.cost.toString()))}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      STATUS_BADGE[p.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {STATUS_LABELS[p.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ServerPagination
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        pageSize={list.pageSize}
        baseParams={{ tab: "pensions", ...searchParams }}
      />
    </div>
  );
}

async function VehiclesPanel({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const filters = vehiclesFiltersSchema.parse({
    status: searchParams.status,
    serviceType: searchParams.serviceType,
    search: searchParams.search,
    page: searchParams.page ?? "1",
    pageSize: "10",
  });
  const list = await vehicleService.list(filters);

  return (
    <div className="crm-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          {list.total} trámites
        </span>
        <form className="flex gap-2 ml-auto" method="get">
          <input type="hidden" name="tab" value="vehicles" />
          <input
            name="search"
            defaultValue={searchParams.search ?? ""}
            placeholder="Buscar..."
            className="h-9 px-3 text-sm border border-slate-200 rounded-md bg-slate-50"
          />
          <select
            name="serviceType"
            defaultValue={searchParams.serviceType ?? ""}
            className="crm-select max-w-[180px]"
          >
            <option value="">Todos los trámites</option>
            {VEHICLE_SERVICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="crm-select max-w-[180px]"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <button className="h-9 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Filtrar
          </button>
        </form>
      </div>

      {list.items.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-400">
          No hay trámites vehiculares.
        </div>
      ) : (
        <table className="w-full crm-table">
          <thead>
            <tr>
              {["Cliente", "Trámite", "Inicio", "Cotización", "Estado"].map((h) => (
                <th key={h} className="text-left px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.items.map((v) => (
              <tr key={v.id} className="border-t border-slate-50">
                <td className="px-5 py-3">
                  <Link
                    href={`/contacts/${v.contact.id}`}
                    className="text-sm font-semibold text-slate-800 hover:text-blue-600"
                  >
                    {v.contact.fullName}
                  </Link>
                  <p className="text-xs text-slate-400 font-mono">{v.contact.code}</p>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">
                  {label(VEHICLE_SERVICE_TYPES, v.serviceType)}
                </td>
                <td className="px-5 py-3 text-sm text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formatDate(v.startDate, "dd MMM yyyy")}
                </td>
                <td className="px-5 py-3 text-sm text-slate-700">
                  {v.quote ? formatCurrency(Number(v.quote.toString())) : "—"}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      STATUS_BADGE[v.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {STATUS_LABELS[v.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ServerPagination
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        pageSize={list.pageSize}
        baseParams={{ tab: "vehicles", ...searchParams }}
      />
    </div>
  );
}

function ServerPagination({
  page,
  totalPages,
  total,
  pageSize,
  baseParams,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  baseParams: Record<string, string | undefined>;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  function href(p: number) {
    const params = new URLSearchParams();
    Object.entries(baseParams).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.set(k, v);
    });
    params.set("page", String(p));
    return `/services?${params.toString()}`;
  }

  const windowStart = Math.max(1, page - 2);
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
      <p className="text-xs text-slate-400">
        Mostrando {start}–{end} de {total}
      </p>
      <div className="flex items-center gap-1">
        {pages.map((n) => (
          <Link
            key={n}
            href={href(n)}
            className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium ${
              n === page
                ? "bg-blue-600 text-white"
                : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            {n}
          </Link>
        ))}
      </div>
    </div>
  );
}
