# Arquitectura — CRM Seguros Mexa

## Patrón General
- **Clean Architecture Light** con **Feature-Based Architecture**
- Principios SOLID
- Patrones: Repository, Service Layer, DTO, Modular Design

## Stack Tecnológico
| Área | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| UI Styling | Tailwind CSS + CSS custom |
| Componentes | shadcn/ui |
| Iconos | Lucide React |
| Tablas | TanStack Table |
| Formularios | React Hook Form + Zod |
| Calendario | FullCalendar |
| Estado Global | Zustand |
| Fechas | date-fns |
| Notificaciones UI | Sonner |
| Backend | Next.js API Routes |
| ORM | Prisma |
| Base de Datos | MySQL |
| Autenticación | Auth.js (NextAuth v5) |
| Password Hash | bcrypt |
| Storage | Filesystem local (UUID naming) |
| Hosting | Hostinger Business |

## Estructura de Carpetas
```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # rutas protegidas
│   │   ├── dashboard/
│   │   ├── contacts/
│   │   ├── services/
│   │   ├── calendar/
│   │   └── pipeline/
│   ├── (public)/               # rutas públicas
│   │   └── login/
│   └── api/                    # API Routes
│       ├── auth/
│       ├── contacts/
│       ├── services/
│       ├── calendar/
│       ├── pipeline/
│       └── dashboard/
│
├── modules/                    # Feature modules
│   ├── auth/
│   ├── contacts/
│   ├── policies/
│   ├── prospects/
│   ├── calendar/
│   ├── dashboard/
│   ├── finances/
│   ├── reminders/
│   └── activities/
│
├── core/                       # Núcleo del sistema
│   ├── auth/
│   ├── config/
│   ├── database/
│   ├── errors/
│   ├── security/
│   ├── constants/
│   └── utils/
│
├── infrastructure/             # Servicios externos
│   ├── prisma/
│   ├── storage/
│   ├── logging/
│   └── services/
│
├── shared/                     # Código compartido
│   ├── components/
│   ├── ui/
│   ├── hooks/
│   ├── types/
│   └── lib/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
└── middleware.ts               # Protección de rutas
```

## Estructura por Módulo (patrón uniforme)
```
modules/[nombre]/
├── components/     # Componentes React del módulo
├── services/       # Lógica de negocio
├── repositories/   # Acceso a datos (Prisma)
├── schemas/        # Validación Zod
├── hooks/          # React hooks del módulo
├── actions/        # Server Actions
├── types/          # Tipos TypeScript
├── dto/            # Data Transfer Objects
└── pages/          # Páginas Next.js del módulo
```

## Flujo de Datos
```
UI Component
    ↓
React Hook Form + Zod (validación client)
    ↓
Server Action / API Route
    ↓
Zod (validación server)
    ↓
Service Layer (lógica negocio)
    ↓
Repository Layer (abstracción DB)
    ↓
Prisma ORM
    ↓
MySQL (con Stored Procedures para insert/update/delete)
```

## Seguridad
- Auth.js con HttpOnly Cookies
- Middleware protege todas las rutas /(auth)/
- Roles: ADMIN / USER
- Validación doble: client (Zod) + server (Zod)
- Rate limiting en login y uploads
- AuditLog para cambios críticos
- Variables sensibles en .env

## Decisiones de Diseño CSS
- **Tailwind CSS** para utilidades, layout, spacing, responsive
- **CSS custom** (globals.css) para variables de marca, colores del sidebar, gradientes especiales
- **shadcn/ui** para componentes base (Dialog, Table, Form, Select, etc.)
- **NO usar** librerías CSS adicionales (evitar sobreingeniería)
