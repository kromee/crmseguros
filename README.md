# CRM Seguros — CRM SaaS multi-tenant

CRM para agentes de seguros: contactos, pólizas, pipeline, calendario, finanzas y panel de plataforma SaaS.

Documentación detallada: [`PROYECTO.md`](./PROYECTO.md) · [`PLAN.md`](./PLAN.md) · [`DOCKER.md`](./DOCKER.md) · [`BACKUPS.md`](./BACKUPS.md)

## Requisitos

- Node.js 20+
- MySQL 8.0 (Docker local o MySQL en Hostinger)
- npm

## Desarrollo local

```bash
cp .env.example .env
# Editar AUTH_SECRET (openssl rand -base64 32)

npm install
npm run db:setup    # Docker MySQL + migraciones + seed
npm run dev         # http://localhost:3000
```

Credenciales demo (seed):

| Rol | Email | Contraseña |
|-----|-------|------------|
| Super admin | `superadmin@crm.local` | `Admin123!` |
| Admin agencia | `admin@segurosmexa.com` | `Admin123!` |

## Variables de entorno (producción)

Copiar `.env.example` → `.env` en el servidor. Mínimo:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | MySQL (`mysql://user:pass@host:3306/db`) |
| `AUTH_SECRET` | Secreto Auth.js (32+ bytes aleatorios) |
| `AUTH_URL` | URL pública (`https://tudominio.com`) |
| `NEXT_PUBLIC_APP_URL` | Igual que `AUTH_URL` |
| `NODE_ENV` | `production` |
| `ALLOW_LEGACY_UPLOAD_PATHS` | `false` tras migrar uploads (ver abajo) |

Ver `.env.example` para soporte, producto y storage.

## Build y arranque

```bash
npm ci
npx prisma migrate deploy
npm run build
npm run start
```

Con **PM2** (recomendado en Hostinger VPS):

```bash
pm2 start npm --name crmseguros -- start
pm2 save
pm2 startup
```

Varias instancias PM2: el rate limit de login persiste en MySQL (`login_rate_limits`).

## Migraciones y datos

```bash
npx prisma migrate deploy   # producción
npm run db:seed             # solo entornos demo/staging
npm run db:sync-catalog     # sincronizar planes SaaS
```

## Archivos subidos (uploads)

Estructura: `uploads/{tenantId}/{categoria}/...`

Antes de producción multi-tenant:

```bash
npm run uploads:migrate          # dry-run
npm run uploads:migrate -- --apply # mover legacy → tenant
```

Luego en `.env`:

```env
ALLOW_LEGACY_UPLOAD_PATHS=false
```

En producción (`NODE_ENV=production`) las rutas legacy ya están **bloqueadas por defecto**.

## Backups

```bash
npm run backup
```

Restauración: [`BACKUPS.md`](./BACKUPS.md)

Programar cron diario en el servidor:

```bash
0 3 * * * cd /ruta/crmseguros && npm run backup >> /var/log/crm-backup.log 2>&1
```

## Deploy en Hostinger (VPS)

Secuencia recomendada antes del primer deploy:

1. `npm run lint` y `npx tsc --noEmit`
2. `npm run build` en CI o en el servidor
3. MySQL remoto + `migrate deploy`
4. `uploads:migrate --apply` si hay datos legacy
5. Nginx reverse proxy → `localhost:3000` + SSL (Let’s Encrypt)
6. PM2 para proceso Node

### Nginx (ejemplo)

```nginx
server {
  listen 443 ssl http2;
  server_name tudominio.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### CI/CD (GitHub Actions → VPS)

Flujo típico:

1. Push a `main` → workflow ejecuta `lint`, `tsc`, `build`
2. SSH al VPS → `git pull`, `npm ci`, `prisma migrate deploy`, `npm run build`, `pm2 reload crmseguros`

Rollback: checkout del commit anterior + `npm ci` + `npm run build` + `pm2 reload`.

## Seguridad en producción

- Rutas de archivos validadas con `path.resolve` dentro de `uploads/` (sin path traversal)
- Acceso a archivos acotado por tenant (+ super admin)
- Rate limit de login en MySQL (5 intentos / 15 min por email)
- Códigos de contacto `SM-XXXX` con reintento ante colisión única
- **Sesión única por usuario**: si la cuenta ya tiene sesión activa, el nuevo inicio de sesión se **rechaza** (todos los roles, incl. super admin). Al cerrar sesión se libera el cupo. TTL alineado con la sesión JWT (8 h).

## Scripts útiles

| Comando | Uso |
|---------|-----|
| `npm run dev:clean` | Reinicia dev con caché limpia |
| `npm run db:studio` | Explorador Prisma |
| `npm run backup` | Backup MySQL + uploads |
| `npm run uploads:migrate` | Migrar archivos legacy |

## Licencia

Proyecto privado.
