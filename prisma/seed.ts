import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER ?? "crm",
  password: process.env.DATABASE_PASSWORD ?? "crm_password",
  database: process.env.DATABASE_NAME ?? "crmseguros",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

const NAMES = [
  "Alejandro Mendoza", "Mariana Cervantes", "Roberto Esquivel", "Jimena Valadez",
  "Carlos Ramírez", "Patricia López", "Fernando Torres", "Ana García",
  "Miguel Herrera", "Sofía Castillo", "Diego Morales", "Gabriela Flores",
  "José Sánchez", "Laura Reyes", "Ricardo Guzmán", "Daniela Ortiz",
  "Eduardo Domínguez", "Verónica Cruz", "Arturo Navarro", "Claudia Rojas",
  "Raúl Jiménez", "Isabel Medina", "Hugo Vargas", "Natalia Peña",
  "Sergio Aguilar", "Andrea Salazar", "Pablo Romero", "Carmen Delgado",
  "Enrique Ruiz", "Alicia Contreras", "Óscar Molina", "Lucía Guerrero",
  "Alberto Vega", "Rosa Paredes", "Tomás Figueroa", "Eva Espinoza",
  "Francisco Lara", "Diana Fuentes", "Javier Ríos", "Beatriz Campos",
  "Manuel Solís", "Gloria Ibarra", "Héctor Luna", "Silvia Estrada",
  "Alfredo Durán", "Mónica Palacios", "Luis Camacho", "Adriana Mejía",
  "Ramón Ochoa", "Teresa Bautista",
];

const CITIES = [
  { city: "CDMX", state: "CDMX" }, { city: "Monterrey", state: "NL" },
  { city: "Guadalajara", state: "JAL" }, { city: "Puebla", state: "PUE" },
  { city: "Querétaro", state: "QRO" }, { city: "Mérida", state: "YUC" },
  { city: "León", state: "GTO" }, { city: "Tijuana", state: "BC" },
  { city: "Toluca", state: "MEX" }, { city: "Cancún", state: "QROO" },
];

const ORIGINS = ["SITIO_WEB", "FACEBOOK", "RECOMENDADO", "WHATSAPP", "INSTAGRAM", "GOOGLE_MAPS", "FAMILIA", "AMIGO", "OTRO"] as const;
const INSURERS = ["GNP", "AXA", "Qualitas", "Mapfre", "Zurich", "Chubb", "MetLife", "Banorte Seguros"];
const PLANS_VIDA = ["Vida Integral Plus", "Protección Familiar", "Vida Total", "Plan Patrimonial", "Seguro Educativo"];
const PLANS_AUTO = ["Cobertura Amplia", "Responsabilidad Civil", "Limitada Plus", "Básica"];
const COVERAGE_TYPES = ["AMPLIA", "LIMITADA", "BASICA", "RC"] as const;
const CURRENCIES = ["MXN", "USD", "UDI"] as const;
const FREQUENCIES = ["MENSUAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"] as const;
const PAYMENT_METHODS = ["EFECTIVO", "TRANSFERENCIA", "TARJETA", "CHEQUE", "DOMICILIACION"] as const;
const ACTIVITY_TYPES = ["LLAMADA", "EMAIL", "WHATSAPP", "NOTA", "VISITA"] as const;
const EVENT_TYPES = ["RENOVACION", "COBRO_PAGO", "SEGUIMIENTO", "LLAMADA", "TAREA"] as const;
const PRIORITIES = ["BAJA", "MEDIA", "ALTA", "ATENCION"] as const;
const STAGES = ["CONTACTO_INICIAL", "SEGUIMIENTO", "COTIZACION", "CIERRE"] as const;
const SERVICES_INTEREST = ["Seguro de Vida", "Seguro de Auto", "Gastos Médicos", "Pensión IMSS", "Trámite Vehicular"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(yearMin: number, yearMax: number) {
  const y = rand(yearMin, yearMax);
  const m = rand(0, 11);
  const d = rand(1, 28);
  return new Date(y, m, d);
}

function futureDate(daysMin: number, daysMax: number) {
  const now = Date.now();
  return new Date(now + rand(daysMin, daysMax) * 24 * 60 * 60 * 1000);
}

function pastDate(daysMin: number, daysMax: number) {
  const now = Date.now();
  return new Date(now - rand(daysMin, daysMax) * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("🌱 Limpiando base de datos...");

  await prisma.payment.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.prospect.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.pensionService.deleteMany();
  await prisma.vehicleService.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Creando usuarios...");
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin Mexa",
      email: "admin@segurosmexa.com",
      password: passwordHash,
      role: "ADMIN",
      title: "Administrador",
    },
  });

  const broker = await prisma.user.create({
    data: {
      name: "M. Rodriguez",
      email: "m.rodriguez@segurosmexa.com",
      password: passwordHash,
      role: "USER",
      title: "Broker Senior",
    },
  });

  const broker2 = await prisma.user.create({
    data: {
      name: "L. Fernández",
      email: "l.fernandez@segurosmexa.com",
      password: passwordHash,
      role: "USER",
      title: "Asesor",
    },
  });

  const users = [admin, broker, broker2];

  console.log("📇 Creando 50 contactos...");
  const contacts: Array<{ id: string; type: string; fullName: string }> = [];

  for (let i = 0; i < 50; i++) {
    const name = NAMES[i];
    const loc = pick(CITIES);
    const isClient = i < 30;
    const code = `SM-${String(1000 + i).padStart(4, "0")}`;

    const contact = await prisma.contact.create({
      data: {
        code,
        type: isClient ? "CLIENT" : "PROSPECT",
        fullName: name,
        phone: `+52 ${rand(55, 99)} ${rand(1000, 9999)} ${rand(1000, 9999)}`,
        email: `${name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}${rand(10, 99)}@email.com`,
        birthDate: randomDate(1960, 2000),
        city: loc.city,
        state: loc.state,
        origin: pick(ORIGINS),
        status: isClient ? (Math.random() > 0.15 ? "ACTIVE" : "INACTIVE") : "PENDING",
        assignedTo: pick(users).id,
      },
    });
    contacts.push({ id: contact.id, type: contact.type, fullName: contact.fullName });
  }

  const clients = contacts.filter((c) => c.type === "CLIENT");
  const prospects = contacts.filter((c) => c.type === "PROSPECT");

  console.log("📋 Creando pólizas...");
  const policyIds: Array<{ id: string; contactId: string; policyNumber: string; premium: number }> = [];

  for (let i = 0; i < 40; i++) {
    const client = clients[i % clients.length];
    const isVida = Math.random() > 0.5;
    const isAuto = !isVida && Math.random() > 0.4;
    const type = isVida ? "VIDA" : isAuto ? "AUTO" : "OTRO";
    const startDate = randomDate(2024, 2026);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    const premium = isVida ? rand(8000, 50000) : isAuto ? rand(5000, 25000) : rand(3000, 15000);
    const policyNumber = `${type.slice(0, 2)}-${rand(2024, 2026)}-${rand(10000, 99999)}`;

    const isExpiringSoon = i < 8;
    const adjustedEnd = isExpiringSoon
      ? futureDate(5, 55)
      : endDate;

    const policy = await prisma.policy.create({
      data: {
        contactId: client.id,
        policyNumber,
        type,
        plan: type === "VIDA" ? pick(PLANS_VIDA) : type === "AUTO" ? pick(PLANS_AUTO) : "GMM Plus",
        insurer: pick(INSURERS),
        startDate,
        endDate: adjustedEnd,
        paymentFrequency: pick(FREQUENCIES),
        premium,
        sumInsured: type === "VIDA" ? rand(500000, 10000000) : type === "AUTO" ? rand(100000, 800000) : rand(200000, 5000000),
        status: i < 35 ? "ACTIVE" : i < 38 ? "RENEWAL" : "EXPIRED",
        insuredAsset: type === "AUTO" ? `${pick(["Toyota Corolla", "Nissan Sentra", "Honda Civic", "VW Jetta", "Mazda 3", "Kia Forte"])} ${rand(2018, 2025)}` : null,
        coverageType: type === "AUTO" ? pick(COVERAGE_TYPES) : null,
        currency: type === "VIDA" ? pick(CURRENCIES) : null,
        term: type === "VIDA" ? `${pick(["10", "15", "20", "25", "30"])} años` : null,
      },
    });
    policyIds.push({ id: policy.id, contactId: client.id, policyNumber, premium });
  }

  console.log("💰 Creando pagos...");
  for (const pol of policyIds.slice(0, 25)) {
    const numPayments = rand(1, 4);
    for (let j = 0; j < numPayments; j++) {
      await prisma.payment.create({
        data: {
          policyId: pol.id,
          amount: Math.round(pol.premium / rand(1, 4)),
          paymentDate: pastDate(10, 300),
          periodStart: pastDate(300, 365),
          periodEnd: futureDate(1, 180),
          method: pick(PAYMENT_METHODS),
          reference: `REF-${rand(100000, 999999)}`,
          status: Math.random() > 0.1 ? "CONFIRMED" : "PENDING",
        },
      });
    }
  }

  console.log("🏦 Creando servicios de pensión...");
  for (let i = 0; i < 8; i++) {
    const client = clients[rand(0, clients.length - 1)];
    const cost = rand(5000, 25000);
    await prisma.pensionService.create({
      data: {
        contactId: client.id,
        requestDate: pastDate(10, 180),
        requestType: pick(["ASESORIA", "TRAMITE", "OTRO"]),
        pensionLaw: pick(["IMSS_LEY73", "AFORE_LEY97", "OTRO"]),
        cost,
        advance: Math.random() > 0.3 ? rand(1000, cost) : null,
        advanceDate: Math.random() > 0.3 ? pastDate(5, 60) : null,
        settlement: Math.random() > 0.6 ? cost : null,
        settlementDate: Math.random() > 0.6 ? pastDate(1, 30) : null,
        description: pick([
          "Asesoría para pensión IMSS Ley 73",
          "Trámite completo de pensión",
          "Revisión de semanas cotizadas",
          "Cálculo de pensión estimada",
          "Corrección de nombre en IMSS",
        ]),
        status: pick(["PENDING", "IN_PROGRESS", "COMPLETED"]),
      },
    });
  }

  console.log("🚗 Creando trámites vehiculares...");
  for (let i = 0; i < 10; i++) {
    const client = contacts[rand(0, contacts.length - 1)];
    await prisma.vehicleService.create({
      data: {
        contactId: client.id,
        startDate: pastDate(5, 120),
        serviceType: pick(["PLACAS_NUEVAS", "ALTA", "BAJA", "RENOVACION_PLACAS", "TARJETA_CIRCULACION", "OTRO"]),
        requestMode: pick(["COTIZACION", "TRAMITE"]),
        description: pick([
          "Alta de placas vehículo nuevo",
          "Cambio de propietario",
          "Baja vehicular por siniestro",
          "Verificación vehicular semestral",
          "Renovación de tarjeta de circulación",
        ]),
        quote: rand(1500, 8000),
        status: pick(["PENDING", "IN_PROGRESS", "COMPLETED"]),
        documents: {
          ine: Math.random() > 0.3,
          tarjetaCirculacion: Math.random() > 0.4,
          factura: Math.random() > 0.5,
          titulo: Math.random() > 0.6,
        },
      },
    });
  }

  console.log("📊 Creando prospectos...");
  for (let i = 0; i < 15; i++) {
    const prospect = i < prospects.length ? prospects[i] : clients[rand(20, 29)];
    await prisma.prospect.create({
      data: {
        code: `PR-${rand(100, 999)}`,
        contactId: prospect.id,
        stage: pick(STAGES),
        priority: pick(PRIORITIES),
        serviceOfInterest: pick(SERVICES_INTEREST),
        estimatedValue: rand(8000, 200000),
        probability: rand(15, 95),
        assignedTo: pick(users).id,
        notes: pick([
          "Interesado en cobertura familiar",
          "Requiere seguimiento urgente",
          "Comparando con competencia",
          "Esperando aprobación de pareja",
          "Muy interesado, pedir documentos",
          null,
        ]),
        nextActionType: pick(["LLAMADA", "CITA", "EMAIL", null]),
        nextActionDate: Math.random() > 0.3 ? futureDate(1, 14) : null,
        rating: rand(1, 5),
      },
    });
  }

  console.log("📝 Creando actividades...");
  const summaries: Record<string, string[]> = {
    LLAMADA: [
      "Llamada para dar seguimiento a cotización",
      "Confirmación de datos para póliza",
      "Cliente solicitó información adicional",
      "Llamada de bienvenida al servicio",
      "Seguimiento post-venta",
    ],
    EMAIL: [
      "Envío de cotización en PDF",
      "Envío de condiciones generales de póliza",
      "Recordatorio de pago próximo",
      "Documentos de renovación enviados",
    ],
    WHATSAPP: [
      "Mensaje para confirmar cita",
      "Envío de liga de pago",
      "Respuesta a consulta sobre cobertura",
      "Seguimiento rápido vía WhatsApp",
    ],
    NOTA: [
      "Cliente menciona que viajará el próximo mes",
      "Requiere factura para deducción fiscal",
      "Prefiere contacto solo por las tardes",
    ],
    VISITA: [
      "Visita en oficina para firma de documentos",
      "Reunión presencial para revisión de póliza",
      "Entrega de póliza física en domicilio",
    ],
  };

  for (let i = 0; i < 80; i++) {
    const contact = contacts[rand(0, contacts.length - 1)];
    const type = pick(ACTIVITY_TYPES);
    await prisma.activity.create({
      data: {
        contactId: contact.id,
        type,
        summary: pick(summaries[type]),
        result: pick(["EXITOSO", "PENDIENTE", "FINALIZADO", "SIN_RESPUESTA"]),
        performedBy: pick(users).id,
        isAutomatic: Math.random() > 0.9,
        createdAt: pastDate(1, 120),
      },
    });
  }

  console.log("📅 Creando eventos de calendario...");
  const now = new Date();

  function addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  const demoReminders = [
    {
      title: "[Demo] Vencido — cobro no realizado",
      type: "COBRO_PAGO" as const,
      startDate: addMinutes(now, -120),
      endDate: addMinutes(now, -90),
      reminderMinutes: 30,
    },
    {
      title: "[Demo] Recordar ahora — renovación póliza",
      type: "RENOVACION" as const,
      startDate: addMinutes(now, 30),
      endDate: addMinutes(now, 90),
      reminderMinutes: 60,
    },
    {
      title: "[Demo] Recordar ahora — llamada cliente",
      type: "LLAMADA" as const,
      startDate: addMinutes(now, 50),
      endDate: addMinutes(now, 80),
      reminderMinutes: 90,
    },
    {
      title: "[Demo] Próximo — seguimiento prospecto",
      type: "SEGUIMIENTO" as const,
      startDate: addMinutes(now, 100),
      endDate: addMinutes(now, 130),
      reminderMinutes: 60,
    },
    {
      title: "[Demo] Próximo — tarea documentación",
      type: "TAREA" as const,
      startDate: addMinutes(now, 130),
      endDate: addMinutes(now, 160),
      reminderMinutes: 75,
    },
  ];

  for (const demo of demoReminders) {
    await prisma.calendarEvent.create({
      data: {
        title: demo.title,
        type: demo.type,
        contactId: contacts[0].id,
        userId: admin.id,
        startDate: demo.startDate,
        endDate: demo.endDate,
        priority: "ALTA",
        notifyClient: false,
        notifyAgent: true,
        reminderMinutes: demo.reminderMinutes,
        status: "PENDING",
      },
    });
  }

  for (let i = 0; i < 25; i++) {
    const contact = contacts[rand(0, contacts.length - 1)];
    const type = pick(EVENT_TYPES);
    const isPast = i < 10;
    const baseDate = isPast ? pastDate(1, 30) : futureDate(0, 30);
    const hour = rand(8, 18);
    const startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour, 0);
    const endDate = new Date(startDate.getTime() + rand(30, 120) * 60 * 1000);

    const titles: Record<string, string> = {
      RENOVACION: `Renovación - ${contact.fullName}`,
      COBRO_PAGO: `Cobro programado - ${contact.fullName}`,
      SEGUIMIENTO: `Seguimiento - ${contact.fullName}`,
      LLAMADA: `Llamada - ${contact.fullName}`,
      TAREA: `Pendiente - ${contact.fullName}`,
    };

    await prisma.calendarEvent.create({
      data: {
        title: titles[type],
        type,
        contactId: contact.id,
        userId: pick(users).id,
        startDate,
        endDate,
        priority: pick(PRIORITIES),
        notifyClient: Math.random() > 0.6,
        notifyAgent: true,
        reminderMinutes: pick([15, 30, 60, 1440]),
        status: isPast ? (Math.random() > 0.3 ? "COMPLETED" : "PENDING") : "PENDING",
      },
    });
  }

  console.log("");
  console.log("✅ Seed completado exitosamente");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   👤 Usuarios:      3");
  console.log("   📇 Contactos:     50 (30 clientes + 20 prospectos)");
  console.log("   📋 Pólizas:       40");
  console.log("   💰 Pagos:         ~60");
  console.log("   🏦 Pensiones:     8");
  console.log("   🚗 Vehiculares:   10");
  console.log("   📊 Prospectos:    15");
  console.log("   📝 Actividades:   80");
  console.log("   📅 Eventos:       30 (incl. 5 demo recordatorios)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   admin@segurosmexa.com / Admin123!");
  console.log("   m.rodriguez@segurosmexa.com / Admin123!");
  console.log("   l.fernandez@segurosmexa.com / Admin123!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
