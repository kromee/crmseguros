# Rendimiento en desarrollo — CRM Seguros Mexa

> **Tu Mac tiene 8 GB de RAM.** Es justo para Next.js 16 + Docker + Cursor + Chrome.  
> Aplicar todo lo de abajo cuando notes lentitud.

## Causas detectadas en este proyecto

| Causa | Estado | Detalle |
|-------|--------|---------|
| Middleware cargaba Prisma | ✅ Resuelto | Se separó `auth.config.ts` |
| Librerías pesadas sin usar | ✅ Resuelto | FullCalendar y TanStack Table desinstalados |
| Turbopack consume mucho en arranque | ✅ Resuelto | `npm run dev` ahora usa Webpack |
| Compilación de todas las rutas | ✅ Resuelto | `onDemandEntries` compila solo la ruta visitada |
| Lucide-react bundle gigante | ✅ Resuelto | `optimizePackageImports` activo |
| Límite memoria Node abierto | ✅ Resuelto | `--max-old-space-size=2048` (2 GB tope) |

## Causas externas (fuera del proyecto)

| Cosa | Acción |
|------|--------|
| **Extensión CodeGPT en VS Code** consumiendo CPU | Desactivar si no la usas |
| Varios `next-server` colgados de otros proyectos | `pkill -f "next-server"` |
| Cursor + VS Code abiertos a la vez | Cerrar uno |
| Chrome con muchas pestañas | Cerrar pestañas |
| Docker Desktop con varias imágenes | `docker compose down` cuando no desarrollas DB |

## Comandos de desarrollo

```bash
npm run dev          # Webpack + 2 GB tope (recomendado para tu Mac)
npm run dev:turbo    # Turbopack (más rápido si tienes 16+ GB RAM)
```

## Rutina recomendada cada día

```bash
# 1. Limpiar procesos viejos colgados
pkill -f "next-server"; pkill -f "next dev"

# 2. Levantar Docker MySQL (si vas a tocar datos reales)
npm run db:up

# 3. Levantar la app
npm run dev

# 4. Al terminar
npm run db:down      # libera ~500 MB de RAM
```

## Si sigue lento

```bash
# Limpiar cachés de compilación
rm -rf .next node_modules/.cache

# Reiniciar Docker Desktop (a veces consume RAM excesiva)
# Settings → Resources: bajar a 1.5 GB

# Aumentar swap del sistema con: sudo dynamic_pager
```

## Diagnóstico rápido

```bash
# Ver procesos Node/Next vivos
ps -A -o pid,pcpu,pmem,command | grep -E "next|node " | grep -v grep

# Ver qué hay en los puertos 3000-3001
lsof -i :3000 -i :3001

# Memoria libre
vm_stat | grep "Pages free"
```

## Recursos de Docker

Settings → Resources en Docker Desktop:
- **Memory:** 2 GB es suficiente para MySQL
- **CPUs:** 2 cores basta

No le des más de 2 GB o quitarás RAM a Next.

## Importaciones a evitar en el código

- ❌ `import * as ` (importa todo el módulo)
- ✅ `import { Icon } from "lucide-react"` (con `optimizePackageImports` solo trae lo que uses)

## Por qué pasa en el primer GET a `localhost:3000`

Next.js compila **bajo demanda**: la primera vez que visitas una ruta, **compila esa ruta + todas sus dependencias**. Eso usa mucha CPU **por unos segundos**. Después queda en caché y va rápido.

Con `onDemandEntries` configurado, solo mantiene 2 rutas en memoria a la vez (no las 13).
