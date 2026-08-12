# Base de Datos — CRM Seguros Vale

## Motor: MySQL | ORM: Prisma

## Tablas Principales

### users — Usuarios del sistema
| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | UUID |
| name | VARCHAR(150) | |
| email | VARCHAR(255) UNIQUE | |
| password | VARCHAR(255) | bcrypt |
| role | ENUM('ADMIN','USER') | |
| avatar | VARCHAR(500) | URL |
| isActive | BOOLEAN | default true |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

### contacts — Clientes y Prospectos
| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | UUID |
| code | VARCHAR(20) UNIQUE | SV-XXXX, MX-XXXX |
| type | ENUM('CLIENT','PROSPECT') | |
| fullName | VARCHAR(200) | |
| phone | VARCHAR(20) | |
| email | VARCHAR(255) | |
| birthDate | DATE | |
| origin | ENUM(...) | WhatsApp, Facebook, etc. |
| status | ENUM('ACTIVE','INACTIVE','PENDING') | |
| assignedTo | VARCHAR(36) FK → users | |
| notes | TEXT | |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

### policies — Pólizas de Seguro
| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | |
| contactId | VARCHAR(36) FK | |
| policyNumber | VARCHAR(100) UNIQUE | |
| type | ENUM('VIDA','AUTO','OTRO') | |
| plan | VARCHAR(200) | |
| insurer | VARCHAR(200) | GNP, AXA, Qualitas... |
| startDate | DATE | |
| endDate | DATE | |
| paymentFrequency | ENUM('MENSUAL','TRIMESTRAL','SEMESTRAL','ANUAL') | |
| premium | DECIMAL(12,2) | prima |
| sumInsured | DECIMAL(15,2) | suma asegurada |
| status | ENUM('ACTIVE','EXPIRED','CANCELLED','RENEWAL') | |
| documents | JSON | rutas archivos |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

### pension_services — Asesoría de Pensiones
| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | |
| contactId | VARCHAR(36) FK | |
| requestDate | DATE | |
| requestType | ENUM('ASESORIA','TRAMITE','OTRO') | |
| pensionLaw | ENUM('IMSS_LEY73','AFORE_LEY97','OTRO') | |
| cost | DECIMAL(10,2) | |
| advance | DECIMAL(10,2) | anticipo |
| advanceDate | DATE | |
| settlement | DECIMAL(10,2) | finiquito |
| settlementDate | DATE | |
| description | TEXT | |
| status | ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') | |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

### vehicle_services — Trámites Vehiculares
| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | |
| contactId | VARCHAR(36) FK | |
| startDate | DATE | |
| serviceType | ENUM('ALTA','BAJA','PLACAS_NUEVAS','RENOVACION_PLACAS','TARJETA_CIRCULACION','OTRO') | |
| description | TEXT | |
| quote | DECIMAL(10,2) | cotización |
| status | ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') | |
| documents | JSON | INE, tarjeta circulación, factura, título |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

### prospects — Pipeline Comercial
| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | |
| code | VARCHAR(20) UNIQUE | PR-XXX |
| contactId | VARCHAR(36) FK | |
| stage | ENUM('CONTACTO_INICIAL','SEGUIMIENTO','COTIZACION','CIERRE') | |
| priority | ENUM('BAJA','MEDIA','ALTA','ATENCION') | |
| serviceOfInterest | VARCHAR(200) | |
| estimatedValue | DECIMAL(12,2) | |
| probability | INT | 0-100 |
| assignedTo | VARCHAR(36) FK → users | |
| notes | TEXT | |
| nextActionType | ENUM('LLAMADA','CITA','EMAIL','OTRO') | |
| nextActionDate | DATETIME | |
| status | ENUM('ACTIVE','WON','LOST') | |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

### activities — Bitácora de Interacciones
| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | |
| contactId | VARCHAR(36) FK | |
| prospectId | VARCHAR(36) FK NULL | |
| type | ENUM('LLAMADA','EMAIL','WHATSAPP','NOTA','VISITA','DOCUMENTO') | |
| summary | TEXT | resumen |
| result | ENUM('EXITOSO','PENDIENTE','SIN_RESPUESTA','FINALIZADO') | |
| performedBy | VARCHAR(36) FK → users | |
| isAutomatic | BOOLEAN | sistema o manual |
| attachments | JSON | rutas archivos |
| createdAt | DATETIME | |

### calendar_events — Eventos del Calendario
| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | |
| title | VARCHAR(300) | |
| type | ENUM('RENOVACION','COBRO_PAGO','SEGUIMIENTO','LLAMADA','TAREA') | |
| contactId | VARCHAR(36) FK NULL | |
| userId | VARCHAR(36) FK | |
| startDate | DATETIME | |
| endDate | DATETIME | |
| description | TEXT | |
| priority | ENUM('BAJA','MEDIA','ALTA') | |
| notifyClient | BOOLEAN | vía WhatsApp/Email |
| notifyAgent | BOOLEAN | push/CRM |
| reminderMinutes | INT | minutos antes |
| attachments | JSON | |
| status | ENUM('PENDING','COMPLETED','CANCELLED') | |
| syncGoogle | BOOLEAN | Google Calendar |
| createdAt | DATETIME | |

### audit_log — Log de auditoría
| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | |
| userId | VARCHAR(36) FK | |
| entity | VARCHAR(100) | tabla afectada |
| entityId | VARCHAR(36) | ID del registro |
| action | ENUM('CREATE','UPDATE','DELETE','VIEW') | |
| changes | JSON | old → new |
| ipAddress | VARCHAR(50) | |
| createdAt | DATETIME | |

## Stored Procedures (MySQL)
- `sp_create_contact` — insert contact + activity log
- `sp_update_contact_status` — actualiza estado con log
- `sp_create_policy` — insert policy + calendar event automático
- `sp_close_prospect` — cierre pipeline + conversión cliente
- `sp_get_dashboard_stats` — KPIs del dashboard
- `sp_get_upcoming_renewals` — renovaciones próximas 30 días
- `sp_get_pending_payments` — cobros pendientes

## Vistas (MySQL Views)
- `v_active_clients` — contactos activos con sus servicios
- `v_pipeline_summary` — resumen del embudo comercial
- `v_calendar_today` — agenda del día
- `v_expiring_policies` — pólizas por vencer en 60 días

## Índices
- contacts: (type, status), (assignedTo), (phone), (email)
- policies: (contactId), (endDate), (status)
- calendar_events: (userId, startDate), (type, status)
- prospects: (stage, status), (assignedTo)
- activities: (contactId), (createdAt)
