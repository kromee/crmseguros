/**
 * Crea 5 eventos de calendario pensados para probar /reminders.
 * No borra el resto de la base de datos.
 *
 * Uso: npm run db:seed-reminders
 */
import "dotenv/config";
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

const DEMO_PREFIX = "[Demo] ";

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: "admin@segurosmexa.com" },
  });
  if (!admin) {
    throw new Error("No existe admin@segurosmexa.com. Ejecuta primero: npm run db:seed");
  }

  const contact = await prisma.contact.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!contact) {
    throw new Error("No hay contactos. Ejecuta primero: npm run db:seed");
  }

  const tenantId = contact.tenantId ?? admin.tenantId;
  if (!tenantId) {
    throw new Error("No hay tenant asociado al usuario o contacto de demo");
  }

  await prisma.calendarEvent.deleteMany({
    where: { title: { startsWith: DEMO_PREFIX } },
  });

  const now = new Date();

  const demos = [
    {
      title: `${DEMO_PREFIX}Vencido — cobro no realizado`,
      type: "COBRO_PAGO" as const,
      startDate: addMinutes(now, -120),
      endDate: addMinutes(now, -90),
      reminderMinutes: 30,
      description: "Estado esperado en cola: Vencido",
    },
    {
      title: `${DEMO_PREFIX}Recordar ahora — renovación póliza`,
      type: "RENOVACION" as const,
      startDate: addMinutes(now, 30),
      endDate: addMinutes(now, 90),
      reminderMinutes: 60,
      description: "Recordatorio ya pasó; el evento es en ~30 min",
    },
    {
      title: `${DEMO_PREFIX}Recordar ahora — llamada cliente`,
      type: "LLAMADA" as const,
      startDate: addMinutes(now, 50),
      endDate: addMinutes(now, 80),
      reminderMinutes: 90,
      description: "Recordatorio ya pasó; el evento es en ~50 min",
    },
    {
      title: `${DEMO_PREFIX}Próximo — seguimiento prospecto`,
      type: "SEGUIMIENTO" as const,
      startDate: addMinutes(now, 100),
      endDate: addMinutes(now, 130),
      reminderMinutes: 60,
      description: "Recordatorio en ~40 min",
    },
    {
      title: `${DEMO_PREFIX}Próximo — tarea documentación`,
      type: "TAREA" as const,
      startDate: addMinutes(now, 130),
      endDate: addMinutes(now, 160),
      reminderMinutes: 75,
      description: "Recordatorio en ~55 min",
    },
  ];

  for (const demo of demos) {
    await prisma.calendarEvent.create({
      data: {
        tenantId,
        title: demo.title,
        type: demo.type,
        contactId: contact.id,
        userId: admin.id,
        startDate: demo.startDate,
        endDate: demo.endDate,
        description: demo.description,
        priority: "ALTA",
        notifyClient: false,
        notifyAgent: true,
        reminderMinutes: demo.reminderMinutes,
        status: "PENDING",
      },
    });
  }

  console.log("");
  console.log("✅ 5 recordatorios de demo creados");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Usuario:  ${admin.email}`);
  console.log(`   Contacto: ${contact.fullName} (${contact.code})`);
  console.log("");
  console.log("   Cómo probar:");
  console.log("   1. Inicia sesión como admin@segurosmexa.com");
  console.log("   2. Abre http://localhost:3000/reminders");
  console.log("   3. Deberías ver ~2 «Recordar ahora», ~2 «Próximo», 1 «Vencido»");
  console.log("   4. Pulsa «Completar» para quitar uno de la cola");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
