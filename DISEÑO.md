# Sistema de Diseño — CRM Seguros Vale

## Identidad Visual
- **Marca:** Seguros Vale — CRM Corporativo
- **Tagline:** "Innovando tu seguridad, protegiendo tu mañana"

## Paleta de Colores
```css
/* Colores de marca */
--color-sidebar-bg: #0d2461;        /* Azul marino oscuro - sidebar */
--color-sidebar-hover: #1a3a7a;     /* Hover sidebar items */
--color-sidebar-active: #2563eb;    /* Item activo sidebar */
--color-primary: #2563eb;           /* Azul primario - botones CTA */
--color-primary-dark: #1d4ed8;      /* Hover botones */
--color-accent: #3b82f6;            /* Azul acento */

/* Fondos */
--color-bg-page: #f1f5f9;           /* Fondo general */
--color-bg-card: #ffffff;           /* Cards */
--color-bg-header: #ffffff;         /* Topbar */

/* Estados */
--color-success: #22c55e;           /* Activo, exitoso */
--color-warning: #f59e0b;           /* Atención, pendiente */
--color-danger: #ef4444;            /* Error, vencido */
--color-info: #3b82f6;              /* Info */

/* Texto */
--color-text-primary: #0f172a;      /* Texto principal */
--color-text-secondary: #64748b;    /* Texto secundario */
--color-text-muted: #94a3b8;        /* Texto apagado */
--color-text-sidebar: #cbd5e1;      /* Texto sidebar */
--color-text-sidebar-active: #ffffff; /* Texto item activo */
```

## Tipografía
- **Fuente:** Inter (Google Fonts)
- Tamaños: 12px (xs), 14px (sm), 16px (base), 18px (lg), 24px (xl), 32px (2xl)

## Componentes Base

### Sidebar
- Fondo: `--color-sidebar-bg`
- Ancho: 220px fijo
- Logo en la parte superior
- Navegación con iconos Lucide + etiqueta
- Item activo: fondo azul, texto blanco
- Item hover: fondo semi-transparente
- Footer: Configuración y Soporte

### Topbar / Navbar
- Fondo blanco con sombra sutil
- Buscador global centrado
- Notificaciones (campana)
- Toggle modo oscuro
- Avatar del usuario con nombre/rol

### Cards
- Fondo blanco
- Border-radius: 12px
- Sombra: `shadow-sm` o `shadow-md`
- Padding: 20-24px

### Badges de Estado
- Activo: verde (#22c55e) fondo light
- Inactivo: rojo (#ef4444) fondo light
- Pendiente: amarillo (#f59e0b) fondo light
- Alta prioridad: rojo badge sólido
- Media prioridad: azul badge sólido

### Botones
- Primary: fondo `--color-primary`, texto blanco, rounded-lg
- Secondary: borde gris, texto oscuro, rounded-lg
- Danger: fondo rojo
- Ghost: sin fondo, texto azul

### Tabla de Datos
- Header: fondo gris claro (#f8fafc), texto bold
- Filas alternadas suavemente
- Hover en fila: fondo azul muy suave
- Paginación en la parte inferior

## Pantallas de Referencia (imágenes)

### 01 — Panel de Control (Dashboard)
- 4 KPI cards en la parte superior
- Sección de alertas críticas (rojo/amarillo)
- Agenda diaria a la derecha
- Progresión del pipeline
- Registro de actividad reciente (tabla)

### 02 — Directorio de Contactos
- Filtros laterales: Categoría, Origen, Servicio
- Badge "Crecimiento Mensual +12.4%"
- Tabla con: ID, Nombre+Avatar, Teléfono/Correo, Origen badge, Servicio, Status
- Paginación

### 03 — Detalle de Contacto
- Header con foto, nombre, ID, badge Lead Activo, datos personales
- Tabs superiores: Seguros Vida, Asesoría Pensiones, Trámites Vehiculares, + Añadir Servicio
- Card "Detalles de la Póliza" + Card "Periodo de Vigencia" con barra de progreso
- Card hero oscuro "Protección Total" con suma asegurada
- Bitácora de seguimiento en la parte inferior

### 04 — Agregar Contacto (Stepper 3 pasos)
- Paso 1: Datos Generales (toggle Prospecto/Cliente) + Selección de Servicios
- Servicio Seguros: Tipo, Póliza, Vigencia inicio/fin, Frecuencia pago
- Servicio Pensiones: Fecha solicitud, Tipo, Costo, Anticipo, Finiquito, Descripción
- Servicio Trámites: Fecha, Tipo trámite, Descripción, Cotización + documentos (INE, Tarjeta, Factura, Título)
- Bottom: tip CRM + Proyección de Venta
- Botones: Cancelar | Guardar Borrador | Finalizar y Guardar

### 05 — Calendario Operativo
- Vista mensual con filtros: Renovaciones, Cobros/Pagos, Seguimientos
- Botón "+ Nuevo Evento"
- Eventos coloreados por tipo (azul, verde)
- Panel lateral con detalles del evento al hacer clic

### 06 — Programar Nuevo Evento (modal)
- Tipo de evento: Renovación | Cobro/Pago | Seguimiento | Llamada
- Vincular cliente
- Inicio y finalización (fecha + hora)
- Descripción y notas
- Config notificaciones: toggle cliente + toggle agente

### 07 — Programar Nueva Tarea
- Asunto/Título
- Tipo de tarea + Prioridad (Baja/Media/Alta)
- Descripción/Notas
- Panel derecho: Fecha/Hora, Contacto relacionado, Recordatorios (15min/1hr/1día)
- Sincronización automática Google Calendar

### 08 — Pipeline Comercial (Kanban)
- Columnas: Contacto Inicial | Seguimiento | Cotización | Cierre
- Cards de prospecto con: código, nombre, valor, antigüedad, prioridad badge
- Valor Total en header
- Panel inferior: Bitácora de interacciones + Salud del Prospecto

### 09 — Nuevo Prospecto (form)
- Info del Contacto: Nombre, Teléfono, Email, Origen, Prioridad
- Detalles Oportunidad: Servicio de interés, Valor estimado, Notas
- Panel derecho: Próxima Acción (Llamada/Cita), Fecha, Recordatorio, Resumen (Potencial + Calificación)

### 10 — Bitácora de Interacciones
- Header: nombre cliente, ID, póliza, estado ACTIVO
- Panel izquierdo: Nueva Entrada (tipo icono + resumen + resultado)
- Panel derecho: listado filtrable (Todos/Llamadas/Correos/Fecha)
- Items con tipo icono, prioridad badge, descripción
- Contador: Total interacciones (Llamadas/Correos/Otras)

## Notas de Implementación CSS
- Usar variables CSS en `globals.css` para todos los colores de marca
- Tailwind como utilidad principal (spacing, flex, grid, responsive)
- shadcn/ui para componentes interactivos complejos
- CSS custom solo para: gradiente hero card, colores sidebar exactos, barra de progreso animada
- NO usar módulos CSS por archivo (demasiado verbose para este proyecto)
