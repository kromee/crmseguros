# MySQL con Docker — CRM Seguros Mexa

> **Solo desarrollo local.** Docker levanta MySQL en tu máquina para programar y probar.  
> En **producción** la app usa MySQL en el servidor acordado (sin contenedores Docker).

## Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución

## Inicio rápido

```bash
# 1. Levantar MySQL
npm run db:up

# 2. Esperar que esté listo + migrar + seed
npm run db:wait
npm run db:migrate
npm run db:seed

# O todo en uno (después de db:up manual):
npm run db:setup
```

## Credenciales (desarrollo)

Las credenciales de la base de datos están en `.env.example`.  
Copia el archivo y ajusta los valores según tu entorno:

```bash
cp .env.example .env
```

## Usuarios demo (seed)

Los usuarios de prueba se crean con `npm run db:seed`.  
Revisa `prisma/seed.ts` para ver los emails y roles disponibles.

## Comandos útiles

```bash
npm run db:up       # Levantar contenedor
npm run db:down     # Detener contenedor
npm run db:reset    # Borrar volumen y recrear DB
npm run db:studio   # Explorador visual Prisma
docker compose logs mysql -f   # Ver logs MySQL
```

## Datos persistentes
Los datos viven en el volumen Docker `crmseguros_mysql_data`.  
`npm run db:reset` elimina todo y empieza de cero.

## Producción
En producción configura `DATABASE_*` en `.env` con las credenciales del servidor MySQL del entorno en línea.  
No se usa Docker en prod: despliegue de la app Next.js + base MySQL administrada. El mismo schema Prisma aplica en ambos entornos.
