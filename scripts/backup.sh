#!/usr/bin/env bash
# Backup de MySQL + carpeta uploads/
# Uso: npm run backup
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
STAMP="$(date +%Y%m%d_%H%M%S)"
TARGET="$BACKUP_DIR/$STAMP"

DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-3306}"
DB_USER="${DATABASE_USER:-crm}"
DB_PASS="${DATABASE_PASSWORD:-crm_password}"
DB_NAME="${DATABASE_NAME:-crmseguros}"

mkdir -p "$TARGET"

echo "→ Backup MySQL ($DB_NAME)..."
MYSQL_PWD="$DB_PASS" mysqldump \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$TARGET/database.sql.gz"

echo "→ Backup uploads/..."
if [ -d "$ROOT/uploads" ]; then
  tar -czf "$TARGET/uploads.tar.gz" -C "$ROOT" uploads
else
  echo "  (sin carpeta uploads)"
fi

cat > "$TARGET/README.txt" <<EOF
Backup CRM Seguros — $STAMP

Restaurar base de datos:
  gunzip -c database.sql.gz | mysql -h HOST -u USER -p DATABASE

Restaurar archivos:
  tar -xzf uploads.tar.gz -C /ruta/al/proyecto
EOF

echo "✓ Backup guardado en $TARGET"
