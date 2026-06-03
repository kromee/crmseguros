# Backups — CRM Seguros

Copias de seguridad de **MySQL** y la carpeta **`uploads/`** (fotos, pólizas, logos, etc.).

## Requisitos

- `mysqldump` y cliente MySQL (local o acceso al contenedor Docker)
- Variables en `.env`: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`

## Backup manual

```bash
npm run backup
```

Genera en `backups/YYYYMMDD_HHMMSS/`:

| Archivo | Contenido |
|---------|-----------|
| `database.sql.gz` | Volcado completo de la BD |
| `uploads.tar.gz` | Archivos subidos por las agencias |
| `README.txt` | Instrucciones de restauración |

Directorio personalizado:

```bash
BACKUP_DIR=/var/backups/crmseguros npm run backup
```

## Restaurar base de datos

```bash
gunzip -c backups/20260530_120000/database.sql.gz | mysql -h localhost -u crm -p crmseguros
```

Con Docker:

```bash
gunzip -c backups/20260530_120000/database.sql.gz | docker exec -i crmseguros-mysql mysql -u crm -pcrm_password crmseguros
```

## Restaurar uploads

```bash
tar -xzf backups/20260530_120000/uploads.tar.gz -C /ruta/al/proyecto
```

## Automatización (cron)

Ejemplo diario a las 2:00 AM:

```cron
0 2 * * * cd /var/www/crmseguros && BACKUP_DIR=/var/backups/crmseguros npm run backup >> /var/log/crm-backup.log 2>&1
```

Retención (opcional, eliminar backups > 14 días):

```bash
find /var/backups/crmseguros -maxdepth 1 -type d -mtime +14 -exec rm -rf {} \;
```

## Migración uploads legacy

Antes o después del backup, puedes normalizar rutas antiguas:

```bash
npm run uploads:migrate          # simulación
npm run uploads:migrate -- --apply
```

## Producción (Hostinger)

1. Programar `npm run backup` vía cron en el servidor.
2. Copiar `backups/` fuera del servidor (S3, otro VPS, Google Drive con rclone).
3. Incluir backup en el pipeline CI/CD antes de `migrate deploy` (opcional).
