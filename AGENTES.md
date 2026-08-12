# Agentes y Subagentes — CRM Seguros Vale

## Filosofía
- NO un agente gigante único
- Agentes especializados por módulo
- Modelo principal: Claude Sonnet (arquitectura, refactors, servicios)
- Modelos secundarios: GPT-4.1 mini / Gemini Flash (CRUD, formularios, tablas, Tailwind)

## Agentes Definidos

### 🏛️ crm-architect
**Responsabilidad:** Arquitectura global, decisiones de diseño, patrones, refactors mayores
- Revisión de estructura de carpetas
- Definición de interfaces y tipos base
- Decisiones de patrones (Repository, Service Layer, DTO)
- Refactors de módulos completos
- Revisión de esquema Prisma

### 🔐 auth-agent
**Responsabilidad:** Autenticación y seguridad
- Configuración Auth.js (NextAuth v5)
- Middleware de protección de rutas
- Sistema de roles (ADMIN/USER)
- Rate limiting
- Audit logging

### 🗄️ prisma-agent
**Responsabilidad:** Base de datos
- Schema Prisma completo
- Migraciones
- Seeds de datos de prueba
- Stored Procedures MySQL
- Vistas e índices
- Repositorios de datos

### 📊 dashboard-agent
**Responsabilidad:** Panel de control
- KPIs y métricas
- Alertas críticas (pagos vencidos, pólizas por vencer)
- Agenda del día
- Registro de actividad reciente
- Gráficas y progresión del pipeline

### 👥 contacts-agent
**Responsabilidad:** Módulo de Contactos
- Directorio de clientes y prospectos
- Alta de contactos (formulario multi-paso)
- Detalle de contacto con pólizas
- Filtros y búsqueda
- Bitácora de seguimiento por contacto

### 📋 policies-agent
**Responsabilidad:** Módulo de Servicios/Pólizas
- Seguros (Vida, Auto, Otro)
- Asesoría de Pensiones (IMSS Ley 73, AFORE Ley 97)
- Trámites Vehiculares
- Upload de documentos
- Alertas de vencimiento

### 📅 calendar-agent
**Responsabilidad:** Calendario Operativo
- Eventos: Renovaciones, Cobros/Pagos, Seguimientos, Llamadas
- Nueva tarea / nuevo evento
- Detalles del evento con cliente relacionado
- Recordatorios (notificaciones)
- Sincronización Google Calendar (futuro)

### 💼 pipeline-agent
**Responsabilidad:** Pipeline Comercial / Prospectos
- Embudo Kanban (Contacto Inicial → Seguimiento → Cotización → Cierre)
- Nuevo prospecto
- Bitácora de interacciones por prospecto
- Salud del prospecto (probabilidad)
- Conversión a cliente

### 🎨 ui-agent
**Responsabilidad:** Diseño y componentes compartidos
- Layout global (sidebar, navbar)
- Sistema de diseño (colores, tipografía)
- Componentes shared (badges, cards, tables)
- Responsividad
- Fidelidad al diseño de las imágenes de referencia

## Reglas de Colaboración
1. Cada agente trabaja en su carpeta `modules/[nombre]/`
2. Los tipos compartidos van en `shared/types/`
3. Los componentes reutilizables van en `shared/components/`
4. Los agentes NO tocan la carpeta de otro módulo directamente
5. Cambios a `core/` o `infrastructure/` requieren revisión del crm-architect
6. Toda función de repositorio debe pasar por el Service Layer

## Orden de ejecución (obligatorio)
Ver **`PLAN.md`** — fases 0 → 10. No implementar un módulo fuera de su fase.

| Orden | Agente | Cuándo actuar |
|-------|--------|----------------|
| 1 | `crm-architect` | Fase 0, revisiones |
| 2 | `prisma-agent` | Fase 1 |
| 3 | `auth-agent` | Fase 2 |
| 4 | `contacts-agent` | Fase 3 |
| 5 | `policies-agent` | Fase 4 |
| 6 | `contacts-agent` + `pipeline-agent` | Fase 5 |
| 7 | `pipeline-agent` | Fase 6 |
| 8 | `calendar-agent` | Fase 7 |
| 9 | `dashboard-agent` | Fase 8 (después de 3–7) |
| 10 | `prisma-agent` + `policies-agent` | Fase 9 |
| 11 | Todos | Fase 10 |
