# CRM Seguros Mexa — Memoria del Proyecto

## Descripción
CRM corporativo para agente de seguros. Gestión de clientes, pólizas, prospectos, calendario, cobranza y pipeline comercial.

## Plan de ejecución
**Seguir siempre:** [`PLAN.md`](./PLAN.md) — orden de fases, tareas y criterios de cierre.

## Estado por fase (resumen)

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Fundación técnica | 🟡 UI mock lista; faltan tipos base |
| 1 | Base de datos (Docker) | ✅ MySQL + migrate + seed |
| 2 | Auth (login + middleware) | ✅ |
| 3 | Contactos (CRUD real) | ✅ Listado + alta + detalle + edición |
| 4 | Servicios | ✅ Pólizas + pensiones + vehiculares con CRUD y alertas |
| 5 | Bitácora | ✅ Timeline real + filtros + CRUD + contador |
| 6 | Pipeline | ✅ Kanban + alta + mover etapas + convertir a cliente |
| 7 | Calendario | ✅ Vista mensual + eventos + tareas + auto-renovaciones |
| 8 | Dashboard (datos reales) | ✅ KPIs reales + alertas + agenda + actividad + pipeline |
| 9 | Finanzas / archivos | ✅ |
| 10 | Reportes / deploy | ⬜ |

## Comandos útiles
```bash
npm run db:up            # Levantar MySQL (Docker)
npm run db:migrate       # Aplicar migraciones
npm run db:seed          # Datos demo
npm run db:studio        # Explorador Prisma
npm run dev              # App Next.js
```
Ver guía completa: [`DOCKER.md`](./DOCKER.md)

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
