#!/bin/bash
set -euo pipefail

STACK_DIR="/home/berkah/db-stack"
BACKUP_DIR="/home/berkah/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/db_$DATE.sql.gz"

# Load MYSQL_ROOT_PASSWORD from the stack's .env if not already set in environment
if [ -z "${MYSQL_ROOT_PASSWORD:-}" ] && [ -f "$STACK_DIR/.env" ]; then
  MYSQL_ROOT_PASSWORD=$(grep -E '^MYSQL_ROOT_PASSWORD=' "$STACK_DIR/.env" | cut -d '=' -f2-)
fi

if [ -z "${MYSQL_ROOT_PASSWORD:-}" ]; then
  echo "ERROR: MYSQL_ROOT_PASSWORD not set and not found in $STACK_DIR/.env" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

docker compose -f "$STACK_DIR/docker-compose.yml" exec -T db \
  mariadb-dump -u root -p"${MYSQL_ROOT_PASSWORD}" db_praktikum | gzip > "$FILE"

# Keep only last 7 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup done: $FILE"
