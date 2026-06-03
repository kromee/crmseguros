/** Marca genérica del producto (login, marketing, sin tenant) */
export const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "Seguros CRM";
export const PRODUCT_TAGLINE =
  process.env.NEXT_PUBLIC_PRODUCT_TAGLINE ??
  "Gestión profesional para agentes de seguros";

/** @deprecated Preferir PRODUCT_NAME en pantallas públicas */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? PRODUCT_NAME;
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const CONTACT_ORIGINS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "FACEBOOK", label: "Facebook Ads" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "RECOMENDADO", label: "Recomendado" },
  { value: "FAMILIA", label: "Familia" },
  { value: "AMIGO", label: "Amigo" },
  { value: "STAND", label: "Stand" },
  { value: "GOOGLE_MAPS", label: "Google Maps" },
  { value: "PUBLICIDAD", label: "Publicidad" },
  { value: "SITIO_WEB", label: "Sitio Web" },
  { value: "OTRO", label: "Otro" },
] as const;

export const POLICY_TYPES = [
  { value: "VIDA", label: "Seguro de Vida" },
  { value: "AUTO", label: "Seguro de Auto" },
  { value: "OTRO", label: "Otro" },
] as const;

export const PAYMENT_FREQUENCIES = [
  { value: "MENSUAL", label: "Mensual" },
  { value: "TRIMESTRAL", label: "Trimestral" },
  { value: "SEMESTRAL", label: "Semestral" },
  { value: "ANUAL", label: "Anual" },
] as const;

export const COVERAGE_TYPES = [
  { value: "AMPLIA", label: "Amplia" },
  { value: "LIMITADA", label: "Limitada" },
  { value: "BASICA", label: "Básica" },
  { value: "RC", label: "Responsabilidad Civil (RC)" },
] as const;

export const CURRENCIES = [
  { value: "MXN", label: "Pesos (MXN)" },
  { value: "USD", label: "Dólares (USD)" },
  { value: "UDI", label: "UDIs" },
] as const;

export const PAYMENT_METHODS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "DOMICILIACION", label: "Domiciliación" },
  { value: "OTRO", label: "Otro" },
] as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
};

export const INSURERS = [
  "GNP",
  "AXA",
  "Mapfre",
  "Qualitas",
  "Zurich",
  "MetLife",
  "Allianz",
  "HDI",
  "Chubb",
  "BBVA Seguros",
  "Inbursa",
  "Banorte Seguros",
  "Seguros Atlas",
  "Otra",
] as const;

export const VEHICLE_SERVICE_TYPES = [
  { value: "ALTA", label: "Alta de Placas" },
  { value: "BAJA", label: "Baja" },
  { value: "PLACAS_NUEVAS", label: "Placas Nuevas" },
  { value: "RENOVACION_PLACAS", label: "Renovación de Placas" },
  { value: "TARJETA_CIRCULACION", label: "Tarjeta de Circulación" },
  { value: "OTRO", label: "Otro" },
] as const;

export const VEHICLE_REQUEST_MODES = [
  { value: "COTIZACION", label: "Cotización" },
  { value: "TRAMITE", label: "Trámite" },
] as const;

export const VEHICLE_DOCUMENT_TYPES = [
  { key: "ine", label: "INE" },
  { key: "tarjetaCirculacion", label: "Tarjeta de Circulación" },
  { key: "factura", label: "Factura" },
  { key: "titulo", label: "Título de propiedad" },
] as const;

export const PENSION_LAWS = [
  { value: "IMSS_LEY73", label: "IMSS Ley 73" },
  { value: "AFORE_LEY97", label: "AFORE Ley 97" },
  { value: "OTRO", label: "Otro" },
] as const;

export const PENSION_REQUEST_TYPES = [
  { value: "ASESORIA", label: "Asesoría" },
  { value: "TRAMITE", label: "Trámite" },
  { value: "OTRO", label: "Otro" },
] as const;

export const PROSPECT_STAGES = [
  { value: "CONTACTO_INICIAL", label: "Contacto Inicial" },
  { value: "SEGUIMIENTO", label: "Seguimiento" },
  { value: "COTIZACION", label: "Cotización" },
  { value: "CIERRE", label: "Cierre" },
] as const;

export const PROSPECT_SERVICE_GROUPS = [
  {
    group: "Seguros",
    options: [
      { value: "Seguro de Auto", label: "Auto" },
      { value: "Seguro de Vida", label: "Vida" },
      { value: "Seguro Otro", label: "Otro" },
    ],
  },
  {
    group: "Asesoría de Pensiones",
    options: [
      { value: "Pensión IMSS Ley 73", label: "IMSS Ley 73" },
      { value: "Pensión AFORE Ley 97", label: "AFORE Ley 97" },
      { value: "Pensión Otro", label: "Otro" },
    ],
  },
  {
    group: "Trámite Vehicular",
    options: [
      { value: "Trámite Alta", label: "Alta" },
      { value: "Trámite Baja", label: "Baja" },
      { value: "Trámite Placas Nuevas", label: "Placas Nuevas" },
      { value: "Trámite Renovación de Placas", label: "Renovación de Placas" },
      { value: "Trámite Tarjeta de Circulación", label: "Tarjeta de Circulación" },
      { value: "Trámite Otro", label: "Otro" },
    ],
  },
] as const;

export const PRIORITIES = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "ATENCION", label: "Atención" },
] as const;

export const EVENT_TYPES = [
  { value: "RENOVACION", label: "Renovación" },
  { value: "COBRO_PAGO", label: "Cobro/Pago" },
  { value: "SEGUIMIENTO", label: "Seguimiento" },
  { value: "LLAMADA", label: "Llamada" },
  { value: "TAREA", label: "Otro" },
] as const;

export const ACTIVITY_TYPES = [
  { value: "LLAMADA", label: "Llamada" },
  { value: "EMAIL", label: "Email" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "NOTA", label: "Nota" },
  { value: "VISITA", label: "Visita" },
  { value: "DOCUMENTO", label: "Documento" },
] as const;

export const ACTIVITY_RESULTS = [
  { value: "EXITOSO", label: "Exitoso" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "SIN_RESPUESTA", label: "Sin Respuesta" },
  { value: "FINALIZADO", label: "Finalizado" },
] as const;

export const CONTACT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  PENDING: "Pendiente",
};

export const POLICY_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  EXPIRED: "Vencido",
  CANCELLED: "Cancelado",
  RENEWAL: "En Renovación",
};
