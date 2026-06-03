# CRM Seguros Mexa — Memoria del Proyecto

## Descripción
CRM corporativo para agente de seguros. Gestión de clientes, pólizas, prospectos, calendario, cobranza y pipeline comercial. Modelo **SaaS multi-tenant** con panel de plataforma para licencias y agencias.

## Plan de ejecución
**Seguir siempre:** [`PLAN.md`](./PLAN.md) — orden de fases, tareas y criterios de cierre.

## Estado por fase (resumen)

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Fundación técnica | 🟡 Operativo; tipos base opcionales |
| 1 | Base de datos (Docker) | ✅ MySQL + migrate + seed |
| 2 | Auth (login + middleware) | ✅ |
| 3 | Contactos (CRUD real) | ✅ Listado + alta + detalle + edición + catálogo orígenes |
| 4 | Servicios | ✅ Pólizas + pensiones + vehiculares + catálogo aseguradoras |
| 5 | Bitácora | ✅ Timeline + filtros + CRUD |
| 6 | Pipeline | ✅ Kanban + alta prospecto + catálogo orígenes |
| 7 | Calendario | ✅ Vista mensual + eventos + recordatorios |
| 8 | Dashboard (datos reales) | ✅ KPIs + alertas + agenda |
| 9 | Finanzas / archivos | ✅ |
| 10 | Reportes / deploy | 🟡 Reportes, settings, backups ✅ — **deploy pendiente** |
| SAAS 0–4 | Multi-tenant + licencias + límites | ✅ |

## Funcionalidades recientes
- **Settings:** perfil en menú usuario; marca y catálogos en modales compactos
- **Catálogos por agencia:** orígenes de contacto y aseguradoras editables
- **Notificaciones:** campana en topbar con alertas reales
- **UX carga:** skeletons por ruta, barra de progreso y fade entre pantallas
- **Contactos:** crecimiento mensual calculado (clientes nuevos vs mes anterior)

## Próximo paso recomendado
**Deploy a producción** (Hostinger + MySQL + SSL + CI/CD). Ver Fase 10.5–10.6 en `PLAN.md`.

## Pendiente post-MVP
- Recuperar contraseña
- Vincular eventos del calendario a póliza/prospecto
- Drag & drop en pipeline
- Google Calendar sync

## Comandos útiles
```bash
npm run db:up            # Levantar MySQL (Docker)
npm run db:migrate       # Aplicar migraciones
npm run db:seed          # Datos demo
npm run db:studio        # Explorador Prisma
npm run dev              # App Next.js
npm run backup           # Backup MySQL + uploads
npm run uploads:migrate  # Migrar uploads legacy → tenant
```
Ver guía completa: [`DOCKER.md`](./DOCKER.md) · [`BACKUPS.md`](./BACKUPS.md)

## Variables de entorno
Ver `.env.example`

## Documentación
| Archivo | Contenido |
|---------|-----------|
| **PLAN.md** | Plan maestro y orden de desarrollo |
| ARQUITECTURA.md | Patrones, stack, flujo de datos |
| DATABASE.md | Esquema, SP, vistas |
| AGENTES.md | Agentes por módulo |
| MODULOS.md | Requisitos por pantalla |
| DISEÑO.md | Sistema visual |
| BACKUPS.md | Backups automatizados |
