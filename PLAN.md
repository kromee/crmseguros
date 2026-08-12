# Plan de Desarrollo — CRM Seguros Vale

> **Documento maestro de ejecución.** Todo el trabajo debe seguir este orden.  
> No saltar fases sin cerrar la anterior. Actualizar checkboxes al completar tareas.

**Última revisión:** 2026-05-30  
**Referencia:** PDF *STACK-DISEÑO Y PROPUESTA FINAL* + mockups en `assets/`

---

## 1. Estado actual (snapshot)

| Capa | Hecho | Pendiente |
|------|-------|-----------|
| Memoria (.md) | ✅ ARQUITECTURA, DATABASE, AGENTES, MODULOS, DISEÑO, PLAN, BACKUPS | Mantener al día |
| Setup Next.js + UI base | ✅ Layout, sidebar, pantallas con datos reales, loaders/skeletons | Tipos base opcionales (0.8) |
| Prisma schema | ✅ Modelos + multi-tenant + catálogos por agencia | SP/vistas (opcional) |
| `src/modules/*` | ✅ Core + reportes + notificaciones + tenants SaaS | — |
| API / Server Actions | ✅ CRUD + archivos + finanzas + reportes CSV | Deploy producción |
| Auth | ✅ Login + middleware + roles + rate limit | Recuperar contraseña (post-MVP) |
| MySQL operativo | ✅ Docker MySQL 8.0, migrado y seed | — |

**Regla:** La UI mock **no cuenta como módulo terminado** hasta que lea/escriba en MySQL vía Service Layer.

---

## 2. Principios del plan (del documento)

1. **Contacto es el núcleo** — todo gira alrededor de cliente/prospecto.
2. **Calendario es crítico** — cobranza, renovaciones, recordatorios.
3. **Sin sobreingeniería** — simplicidad, mantenibilidad, UX administrativa.
4. **Un agente por módulo** — no un agente gigante (ver `AGENTES.md`).
5. **Flujo obligatorio:** UI → Actions → Service → Repository → Prisma → MySQL.

---

## 3. Orden de fases (dependencias)

```
FASE 0 ─ Fundación técnica
    │
    ▼
FASE 1 ─ Base de datos + núcleo compartido
    │
    ▼
FASE 2 ─ Autenticación y seguridad
    │
    ▼
FASE 3 ─ Contactos (módulo central) ◄─── PRIORIDAD NEGOCIO
    │
    ├──► FASE 4 ─ Servicios (pólizas, pensiones, trámites)
    │
    ├──► FASE 5 ─ Actividades / Bitácora
    │
    ├──► FASE 6 ─ Pipeline comercial
    │
    └──► FASE 7 ─ Calendario y tareas
              │
              ▼
         FASE 8 ─ Dashboard (datos reales)
              │
              ▼
         FASE 9 ─ Finanzas + archivos
              │
              ▼
         FASE 10 ─ Reportes + deploy
```

**No iniciar Fase 8 (Dashboard con KPIs reales) antes de Fases 3–7**, o habrá queries incompletas.

---

## 4. Detalle por fase

### FASE 0 — Fundación técnica  
**Agente:** `crm-architect` + `ui-agent`  
**Objetivo:** Proyecto estable, convenciones claras, UI shell reutilizable.

| # | Tarea | Estado |
|---|--------|--------|
| 0.1 | Next.js + TypeScript + Tailwind + shadcn | ✅ |
| 0.2 | Estructura de carpetas (`modules/`, `core/`, `infrastructure/`) | ✅ |
| 0.3 | `globals.css` + variables de marca (`DISEÑO.md`) | ✅ |
| 0.4 | Layout: Sidebar + Topbar + rutas `(auth)` | ✅ |
| 0.5 | Pantallas mock (referencia visual) | ✅ |
| 0.6 | `next.config` — `turbopack.root` (warning lockfiles) | ⬜ |
| 0.7 | Renombrar `package.json` → `crmseguros` | ⬜ |
| 0.8 | Tipos base en `shared/types/` (Contact, Policy, etc.) | ⬜ |

**Criterio de cierre:** `npm run build` sin errores.

---

### FASE 1 — Base de datos  
**Agente:** `prisma-agent`  
**Objetivo:** MySQL con tablas, datos de prueba y capa Repository base.

| # | Tarea | Estado |
|---|--------|--------|
| 1.1 | MySQL en Docker — `docker-compose.yml` + `DOCKER.md` | ✅ |
| 1.2 | `npx prisma migrate dev` — primera migración | ✅ |
| 1.3 | `prisma/seed.ts` — usuario admin + contactos + pólizas demo | ✅ |
| 1.4 | Cliente Prisma 7 + `@prisma/adapter-mariadb` | ✅ |
| 1.5 | Repositorio base abstracto o helpers en `core/database/` | ⬜ |
| 1.6 | Vistas MySQL: `v_active_clients`, `v_expiring_policies` | ⬜ |
| 1.7 | SP iniciales: `sp_get_dashboard_stats` (solo lectura) | ⬜ |

**Criterio de cierre:** `npx prisma studio` muestra datos; seed ejecuta sin error.

---

### FASE 2 — Autenticación  
**Agente:** `auth-agent`  
**Objetivo:** Rutas protegidas; solo usuarios autenticados acceden al CRM.

| # | Tarea | Estado |
|---|--------|--------|
| 2.1 | Auth.js v5 — configuración + provider Credentials | ✅ |
| 2.2 | Página `/login` en `(public)/login` | ✅ |
| 2.3 | `middleware.ts` — redirigir sin sesión → login | ✅ |
| 2.4 | Roles ADMIN / USER en sesión | ✅ |
| 2.5 | Hash bcrypt en seed y registro de usuarios | ✅ |
| 2.6 | `AuditLog` en login | ✅ |
| 2.7 | Rate limit en login (básico) | ✅ |

**Criterio de cierre:** Sin sesión no se accede a `/dashboard`; admin puede entrar.

---

### FASE 3 — Contactos (NÚCLEO)  
**Agente:** `contacts-agent` + `ui-agent`  
**Objetivo:** CRUD completo de clientes y prospectos; primer módulo 100% funcional.

| # | Tarea | Estado |
|---|--------|--------|
| 3.1 | `modules/contacts/schemas` — Zod create/update | ✅ |
| 3.2 | `modules/contacts/repositories` — Prisma queries | ✅ |
| 3.3 | `modules/contacts/services` — reglas (código SV-XXXX, tipo) | ✅ |
| 3.4 | `modules/contacts/actions` — Server Actions | ✅ |
| 3.5 | `/contacts` — listado real + filtros + paginación | ✅ |
| 3.6 | `/contacts/new` — formulario funcional con RHF + Zod + Server Action | ✅ |
| 3.7 | `/contacts/[id]` — detalle con tabs (datos reales) | ✅ |
| 3.8 | Editar perfil (modal `EditContactDialog`) | ✅ |
| 3.9 | TanStack Table en directorio | ⬜ (pospuesto por peso) |
| 3.10 | React Hook Form + Zod en formularios | ✅ |

**Criterio de cierre:** Crear contacto → ver en lista → abrir detalle → editar → persiste en DB.

---

### FASE 4 — Servicios  
**Agente:** `policies-agent`  
**Depende de:** Fase 3 (contactId)

| # | Tarea | Estado |
|---|--------|--------|
| 4.1 | Módulo `policies` — seguros (vida, auto) | ✅ |
| 4.2 | Módulo `pension_services` — asesoría pensiones | ✅ |
| 4.3 | Módulo `vehicle_services` — trámites + docs | ✅ (sin upload de docs, eso queda Fase 9) |
| 4.4 | Tabs en detalle contacto conectados a DB | ✅ |
| 4.5 | `/services` — listado agregado con KPIs y filtros | ✅ |
| 4.6 | Alertas vencimiento (`endDate` + `getExpiryInfo`) | ✅ |
| 4.7 | SP `sp_create_policy` + evento calendario auto | ⏸️ (queda para Fase 7) |

**Criterio de cierre:** Desde alta de contacto se guarda servicio; tabs muestran póliza real.

---

### FASE 5 — Actividades / Bitácora  
**Agente:** `contacts-agent` + `pipeline-agent`  
**Depende de:** Fase 3

| # | Tarea | Estado |
|---|--------|--------|
| 5.1 | Módulo `activities` — schema + repo + service + actions | ✅ |
| 5.2 | Ruta `/contacts/[id]/interactions` (pantalla del mockup) | ✅ |
| 5.3 | Formulario "Nueva Entrada" — tipos, resultado, adjuntos | ✅ (adjuntos diferidos a Fase 9) |
| 5.4 | Timeline filtrable (Todos / Llamadas / Correos / WhatsApp / Notas / Visitas / Documentos) | ✅ |
| 5.5 | Contador total interacciones en sidebar del detalle | ✅ |
| 5.6 | Bitácora resumida en detalle contacto + pipeline | ✅ contacto · ⏸️ pipeline (Fase 6) |

**Criterio de cierre:** Registrar llamada → aparece en timeline del contacto.

---

### FASE 6 — Pipeline comercial  
**Agente:** `pipeline-agent`  
**Depende de:** Fase 3, 5

| # | Tarea | Estado |
|---|--------|--------|
| 6.1 | Módulo `prospects` — schema + repo + service + actions | ✅ |
| 6.2 | `/pipeline` — columnas con datos reales (4 etapas) | ✅ |
| 6.3 | `/pipeline/new` — crear prospecto vinculado a contacto | ✅ |
| 6.4 | Mover tarjeta entre etapas (botones; drag pendiente) | ✅ (sin drag por peso) |
| 6.5 | Panel bitácora al seleccionar tarjeta (drawer lateral) | ✅ |
| 6.6 | Salud del prospecto (% probabilidad con barra y rating) | ✅ |
| 6.7 | "Convertir a Cliente" — transacción + activity log + redirect | ✅ (sin SP, en JS) |

**Criterio de cierre:** Prospecto en Cierre → convertir → contacto pasa a CLIENT.

---

### FASE 7 — Calendario  
**Agente:** `calendar-agent`  
**Depende de:** Fase 3

| # | Tarea | Estado |
|---|--------|--------|
| 7.1 | Módulo `calendar` — schema + repo + service + actions | ✅ |
| 7.2 | Vista mensual custom (grid 7x6 sin FullCalendar) | ✅ (sin FullCalendar por peso) |
| 7.3 | Tipos visibles con leyenda (Renovación, Cobro, Seguimiento, Llamada, Tarea) | ✅ |
| 7.4 | Panel/dialog de eventos del día con detalle | ✅ |
| 7.5 | Modal "Programar nuevo evento" + ruta `/calendar/new-task` | ✅ |
| 7.6 | Recordatorios automáticos al crear pólizas activas (>30 días) | ✅ |
| 7.7 | Flags `notifyClient` / `notifyAgent` / `reminderMinutes` en UI + DB | ✅ |
| 7.8 | Google Calendar sync | ⏸️ FUTURO |

**Criterio de cierre:** Crear evento en calendario → visible en día correcto → editar/eliminar.

---

### FASE 8 — Dashboard  
**Agente:** `dashboard-agent`  
**Depende de:** Fases 3, 4, 6, 7

| # | Tarea | Estado |
|---|--------|--------|
| 8.1 | Service `dashboardService.getAll()` — KPIs desde DB en paralelo | ✅ |
| 8.2 | Alertas críticas (pólizas vencidas + a vencer en 72h) | ✅ |
| 8.3 | Agenda del día — eventos del usuario actual | ✅ |
| 8.4 | Actividad reciente — últimas 8 `activities` con asesor y contacto | ✅ |
| 8.5 | Progresión pipeline — agregación por etapa con etapa activa | ✅ |
| 8.6 | Mock eliminado, saludo personalizado y atajos rápidos | ✅ |

**Criterio de cierre:** KPIs cambian al insertar datos en seed; sin arrays hardcodeados.

---

### FASE 9 — Finanzas y archivos  
**Agente:** `prisma-agent` + `policies-agent`  
**Depende de:** Fase 4

| # | Tarea | Estado |
|---|--------|--------|
| 9.1 | Módulo `payments` + `/finances` — primas, pagos, estatus | ✅ |
| 9.2 | `infrastructure/storage` — upload PDF/JPG/PNG (UUID) | ✅ |
| 9.3 | API protegida para descarga de archivos | ✅ |
| 9.4 | Documentos en trámites vehiculares (INE, factura, etc.) | ✅ |
| 9.5 | Módulo `reminders` — cola básica (sin WhatsApp aún) | ✅ |
| 9.6 | Adjuntos en bitácora de actividades | ✅ |
| 9.7 | Extras: foto contacto, archivo/foto póliza, avatar usuario | ✅ |

**Criterio de cierre:** Subir PDF de póliza → ver en detalle contacto.

---

### FASE 10 — Reportes, settings y deploy  
**Agente:** `crm-architect` + todos

| # | Tarea | Estado |
|---|--------|--------|
| 10.1 | Pantalla **Reportes** (MVP + export CSV) | ✅ |
| 10.2 | `/settings` — perfil (topbar), marca, catálogos, usuarios | ✅ |
| 10.3 | `/support` — página de soporte | ✅ |
| 10.4 | Backups DB + uploads documentados (`BACKUPS.md`, `npm run backup`) | ✅ |
| 10.5 | Deploy Hostinger + SSL + variables producción | ⬜ |
| 10.6 | CI/CD GitHub → Hostinger | ⬜ |

**Criterio de cierre:** App accesible en dominio con login y datos reales.

---

## 5. Asignación agente ↔ fase

| Agente | Fases principales | Modelo sugerido |
|--------|-------------------|-----------------|
| `crm-architect` | 0, 10, revisiones entre fases | Claude Sonnet |
| `prisma-agent` | 1, 9 (DB/SP) | Claude Sonnet |
| `auth-agent` | 2 | Claude Sonnet |
| `contacts-agent` | 3, 5 (parcial) | Sonnet + Flash en forms |
| `policies-agent` | 4, 9 (parcial) | Sonnet + Flash |
| `pipeline-agent` | 5 (parcial), 6 | Sonnet |
| `calendar-agent` | 7 | Sonnet + Flash |
| `dashboard-agent` | 8 | Sonnet |
| `ui-agent` | 0, 3–7 (componentes) | Flash / mini |

---

## 6. Qué hacer AHORA (siguiente sprint)

Fases 3–9 cerradas. Evolución **SaaS multi-tenant** en curso:

| Fase SaaS | Contenido | Estado |
|-----------|-----------|--------|
| SAAS 0 | Schema multi-tenant, roles, seed, filtrado por `tenantId` | ✅ |
| SAAS 2 | Licencias: generar key, activar agencia (`/activar`), panel `/platform/licenses` | ✅ |
| SAAS 3 | Panel platform: agencias, suspender/reactivar, renovar suscripciones | ✅ |
| SAAS 4 | Límites `maxUsers`, storage, suscripción vencida | ✅ |

Próximo trabajo funcional:

1. **Fase 10.5–10.6** — Deploy Hostinger + CI/CD
2. **Commit estable** del repo antes de producción

Pendientes menores / post-MVP:
- 3.9 TanStack Table (postpuesto por peso en RAM)
- Drag & drop en pipeline (mejora futura)
- Google Calendar sync (futuro)
- Recuperar contraseña
- Vincular eventos a póliza/prospecto (hoy solo contacto)
- Completar recordatorio desde panel de notificaciones

Completado recientemente (UX / catálogos):
- Catálogo de orígenes y aseguradoras en contactos, pólizas y nuevo prospecto
- Notificaciones funcionales en topbar
- Loaders: skeletons (dashboard, contactos, servicios, pipeline, calendario) + transición de rutas
- Crecimiento mensual real en directorio de contactos

---

## 7. Pantallas vs plan

| Pantalla (mockup) | Fase que la completa |
|-------------------|----------------------|
| Panel de Control | 8 |
| Directorio Contactos | 3 |
| Detalle Contacto | 3 + 4 |
| Añadir Contacto (3 pasos) | 3 + 4 |
| Servicios | 4 |
| Calendario Operativo | 7 |
| Nuevo Evento (modal) | 7 |
| Nueva Tarea | 7 |
| Pipeline Kanban | 6 |
| Nuevo Prospecto | 6 |
| Bitácora Interacciones | 5 |
| Reportes | 10 |

---

## 8. Control de avance

Actualizar esta tabla al cerrar cada fase:

| Fase | Nombre | Estado | Fecha cierre |
|------|--------|--------|--------------|
| 0 | Fundación | 🟡 En curso | — |
| 1 | Base de datos | ✅ Completada | 2026-05-24 |
| 2 | Auth | ✅ Completada | 2026-05-24 |
| 3 | Contactos | ✅ Completada | 2026-05-24 |
| 4 | Servicios | ✅ Completada | 2026-05-24 |
| 5 | Bitácora | ✅ Completada | 2026-05-24 |
| 6 | Pipeline | ✅ Completada | 2026-05-24 |
| 7 | Calendario | ✅ Completada | 2026-05-24 |
| 8 | Dashboard real | ✅ Completada | 2026-05-24 |
| 9 | Finanzas/archivos | ✅ Completada | 2026-05-27 |
| 10 | Reportes/deploy | 🟡 Reportes + settings + backups ✅; deploy ⬜ | — |
| SAAS 0 | Multi-tenant base | ✅ Completada | 2026-05-28 |
| SAAS 2 | Licencias + activación | ✅ Completada | 2026-05-28 |
| SAAS 3 | Gestión agencias + suscripciones | ✅ Completada | 2026-05-28 |
| SAAS 4 | Límites plan + bloqueo vencimiento | ✅ Completada | 2026-05-28 |

---

## 9. Enlaces entre documentos

| Documento | Uso |
|-----------|-----|
| `PLAN.md` | **Este archivo** — orden de ejecución |
| `PROYECTO.md` | Estado resumido + comandos |
| `MODULOS.md` | Requisitos funcionales por pantalla |
| `DATABASE.md` | Tablas, SP, vistas |
| `ARQUITECTURA.md` | Patrones y estructura |
| `AGENTES.md` | Quién hace qué |
| `DISEÑO.md` | UI y colores |
