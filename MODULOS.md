# Módulos Funcionales — CRM Seguros Vale

## 1. Dashboard (Panel de Control)
**Ruta:** `/dashboard`

### KPIs superiores
- Clientes Activos (con % variación)
- Cobros Pendientes (monto total, prioridad alta)
- Próximas Renovaciones (próximos 30 días)
- Prospectos Activos (con nuevos de hoy)

### Alertas Críticas
- Pagos vencidos (con días de retraso)
- Pólizas por vencer (con horas restantes)
- Sin tarea de renovación asignada

### Progresión del Pipeline
- Barra de etapas: Prospección → Propuesta → Negociación → Cierre
- Ingresos proyectados por etapa

### Agenda Diaria
- Lista de actividades del día con hora
- Botón "+ Programar Nueva Tarea"

### Registro de Actividad Reciente
- Tabla: Fecha/Hora, Entidad, Tipo de Actividad (badge), Descripción, Realizado Por

---

## 2. Contactos (Directorio)
**Rutas:** `/contacts` | `/contacts/[id]` | `/contacts/new`

### Directorio (/contacts)
- Toggle: Clientes | Prospectos
- Filtros: Origen (WhatsApp, Facebook, Recomendado, Web...), Servicio
- Tabla: ID, Nombre+Avatar, Teléfono/Correo, Ciudad, Origen badge, Servicio, Status
- Paginación (1,240 registros ejemplo)
- Exportar / Imprimir / Opciones

### Detalle de Contacto (/contacts/[id])
- Header: Foto, Nombre, ID (MX-XXXXX-X), Badge tipo, Datos personales, Última Actividad
- Botón "Editar Perfil"
- Tabs: Seguros Vida | Asesoría Pensiones | Trámites Vehiculares | + Añadir Servicio
- Por tab activo: detalles póliza, periodo vigencia (con barra progreso), card hero
- Bitácora de seguimiento (actividades recientes)

### Alta de Contacto (/contacts/new) — Stepper 3 pasos
**Paso 1 — Información**
- Toggle Prospecto/Cliente
- Nombre, Teléfono, Correo, Fecha Nacimiento, Origen del Contacto
- Selección de Servicio: Seguros | Pensiones | Trámites Vehiculares
- Campos del servicio según selección

**Paso 2 — Servicios** (campos dinámicos)
- Si Seguros: Tipo Seguro, N° Póliza, Vigencia inicio/fin, Frecuencia Pago
- Si Pensiones: Fecha Solicitud, Tipo, Costo, Anticipo, Finiquito, Fechas, Descripción
- Si Trámites: Fecha, Tipo Trámite, Descripción, Cotización, Docs (INE, Tarjeta, Factura, Título)

**Paso 3 — Revisión**
- Resumen de datos ingresados
- Botones: Cancelar | Guardar Borrador | Finalizar y Guardar

---

## 3. Servicios
**Rutas:** `/services` | `/services/[id]`

### Subtipos
- **Seguros:** Vida, Auto, Otro
  - Campos: Aseguradora, Plan, Póliza, Suma asegurada, Prima, Fechas, Frecuencia pago
- **Pensiones:** IMSS Ley 73, AFORE Ley 97
  - Campos: Tipo solicitud, Costo, Anticipo, Finiquito, Fechas, Descripción, Bitácora
- **Trámites Vehiculares:** Alta, Baja, Placas, Tarjeta circulación, Otro
  - Campos: Tipo, Fecha, Descripción, Cotización, Documentos adjuntos

---

## 4. Calendario Operativo
**Ruta:** `/calendar`

### Vista Principal
- Vista mensual (FullCalendar)
- Filtros por tipo: ✅ Renovaciones | ✅ Cobros/Pagos | ✅ Seguimientos
- Botón "+ Nuevo Evento"
- Click en evento → panel lateral con detalles

### Tipos de Eventos (colores)
- Renovación: azul (#2563eb)
- Cobro/Pago: verde (#22c55e)
- Seguimiento: amarillo (#f59e0b)
- Llamada: gris (#64748b)

### Programar Nuevo Evento (modal)
- Tipo: Renovación | Cobro/Pago | Seguimiento | Llamada
- Vincular cliente (búsqueda por nombre/ID)
- Inicio + Finalización (fecha + hora)
- Descripción y notas
- Config notificaciones: cliente (WhatsApp+Email 24h antes) | agente (push 15min antes)

### Programar Nueva Tarea (/calendar/new-task)
- Asunto/Título
- Tipo de tarea (Llamada, Email, Visita, etc.) + Prioridad
- Descripción/Notas
- Adjuntar archivo | Nota de voz
- Programación: Fecha + Hora
- Contacto relacionado (búsqueda)
- Recordatorios: 15min | 1 hora | 1 día
- Auto-sync Google Calendar

---

## 5. Pipeline Comercial
**Rutas:** `/pipeline` | `/pipeline/new`

### Vista Kanban (/pipeline)
- Header: título, valor total, botón "+ Nuevo Prospecto"
- Columnas (con contador): Contacto Inicial | Seguimiento | Cotización | Cierre
- Cards de prospecto: código (#PR-XXX), nombre, valor, antigüedad (días), prioridad badge, avatar agente
- Badges especiales: ALTA, ATENCIÓN, FINALIZADO
- Alerta "LLAMADA ATRASADA" en rojo

### Panel de Bitácora (al hacer click en card)
- Nombre del prospecto + tab "Nueva Nota"
- Historial de interacciones ordenado por fecha
- Salud del Prospecto: porcentaje circular, Alta/Media/Baja Probabilidad, etiqueta
- Botones: Editar | Compartir

### Nuevo Prospecto (/pipeline/new)
- Info del Contacto: Nombre, Teléfono, Email, Origen, Prioridad
- Detalles Oportunidad: Servicio de interés, Valor estimado (MXN), Notas adicionales
- Panel derecho: Próxima Acción (Llamada/Cita), Fecha programada, Recordatorio
- Resumen: Potencial, Calificación (estrellas)
- Botón "Crear Prospecto" | "Cancelar"

---

## 6. Bitácora / Interacciones
**Rutas:** `/contacts/[id]/interactions` | (también accesible desde pipeline)

### Vista de Interacciones
- Header: nombre cliente, ID, póliza, badge ACTIVO/INACTIVO
- Panel izquierdo: formulario Nueva Entrada
  - Tipo (íconos): Llamada | Email | WhatsApp | Nota | Visita | Documento
  - Resumen de la interacción (textarea)
  - Resultado: Exitoso | Pendiente | Sin Respuesta | Finalizado
  - Adjuntar archivos
  - Botón "Registrar"
  - Contador: Total, Llamadas, Correos, Otras
- Panel derecho: historial filtrable
  - Filtros: Todos | Llamadas | Correos | Fecha: Hoy
  - Items con: icono tipo, fecha/hora, agente, badge resultado, descripción, archivos adjuntos

---

## 7. Configuración / Settings
**Ruta:** `/settings`

- Perfil del usuario (nombre, email, avatar)
- Gestión de usuarios (solo ADMIN)
- Catálogos: Aseguradoras, Tipos de trámite, Orígenes de contacto
- Integraciones futuras (Google Calendar, WhatsApp Business)

---

## Servicios Principales
| Servicio | Subtipos |
|---------|---------|
| Seguros | Vida, Auto, Otro |
| Asesoría Pensiones | IMSS Ley 73, AFORE Ley 97 |
| Trámites Vehiculares | Altas, Bajas, Placas nuevas, Renovación placas, Tarjeta de circulación, Otro |

## Orígenes de Contacto
WhatsApp, Facebook, Instagram, TikTok, Recomendado, Familia, Amigo, Stand, Google Maps, Publicidad, Sitio Web, Otro
