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

# ==========================================================
# 1. Backup database (dump via mariadb-dump, compressed)
# ==========================================================
docker compose -f "$STACK_DIR/docker-compose.yml" exec -T db \
  mariadb-dump -u root -p"${MYSQL_ROOT_PASSWORD}" db_praktikum | gzip > "$FILE"

echo "Backup done: $FILE"

# ==========================================================
# 2. Backup Docker volumes (database volume + file/upload volume)
#    Auto-detect volumes used by this compose stack, so no need
#    to hardcode volume names manually.
# ==========================================================
VOLUME_BACKUP_DIR="$BACKUP_DIR/volumes"
mkdir -p "$VOLUME_BACKUP_DIR"

# Get compose project name (folder name by default, or from .env COMPOSE_PROJECT_NAME)
PROJECT_NAME=$(docker compose -f "$STACK_DIR/docker-compose.yml" config --format json 2>/dev/null \
  | grep -o '"name":[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_NAME" ]; then
  PROJECT_NAME=$(basename "$STACK_DIR")
fi

# List volume names declared in docker-compose.yml
VOLUMES=$(docker compose -f "$STACK_DIR/docker-compose.yml" config --volumes)

for VOL in $VOLUMES; do
  # Actual Docker volume name is usually prefixed with the project name
  FULL_VOL_NAME="${PROJECT_NAME}_${VOL}"

  if ! docker volume inspect "$FULL_VOL_NAME" >/dev/null 2>&1; then
    # Fallback: maybe volume is external / not prefixed
    FULL_VOL_NAME="$VOL"
  fi

  if docker volume inspect "$FULL_VOL_NAME" >/dev/null 2>&1; then
    VOL_FILE="$VOLUME_BACKUP_DIR/${VOL}_$DATE.tar.gz"
    echo "Backing up volume: $FULL_VOL_NAME -> $VOL_FILE"

    docker run --rm \
      -v "${FULL_VOL_NAME}:/volume_data:ro" \
      -v "$VOLUME_BACKUP_DIR:/backup" \
      alpine \
      sh -c "cd /volume_data && tar -czf /backup/${VOL}_$DATE.tar.gz ."
  else
    echo "WARNING: volume $VOL (or $FULL_VOL_NAME) not found, skipping" >&2
  fi
done

# ==========================================================
# 3. Backup .env and config files (NOT source code, that's on GitHub)
# ==========================================================
CONFIG_BACKUP_DIR="$BACKUP_DIR/config"
mkdir -p "$CONFIG_BACKUP_DIR"
CONFIG_FILE="$CONFIG_BACKUP_DIR/config_$DATE.tar.gz"

tar -czf "$CONFIG_FILE" \
  -C "$STACK_DIR" \
  --ignore-failed-read \
  .env docker-compose.yml docker-compose.override.yml 2>/dev/null || true

echo "Config backup done: $CONFIG_FILE"

# ==========================================================
# 3b. Backup TDE encryption keyfile (mysql-encryption/)
#     CRITICAL: this is a bind mount, NOT a Docker volume, so it
#     is NOT covered by the volume backup loop above. Without this
#     keyfile, the encrypted database backup CANNOT be restored.
# ==========================================================
if [ -d "$STACK_DIR/mysql-encryption" ]; then
  TDE_KEY_FILE="$CONFIG_BACKUP_DIR/tde-key_$DATE.tar.gz"
  tar -czf "$TDE_KEY_FILE" -C "$STACK_DIR" mysql-encryption
  chmod 600 "$TDE_KEY_FILE"
  echo "TDE keyfile backup done: $TDE_KEY_FILE"
else
  echo "WARNING: $STACK_DIR/mysql-encryption not found, TDE key NOT backed up!" >&2
fi

# ==========================================================
# 4. Retention: keep only last 7 days for all backup types
# ==========================================================
find "$BACKUP_DIR" -maxdepth 1 -name "*.sql.gz" -mtime +7 -delete
find "$VOLUME_BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$CONFIG_BACKUP_DIR" -name "config_*.tar.gz" -mtime +7 -delete
find "$CONFIG_BACKUP_DIR" -name "tde-key_*.tar.gz" -mtime +7 -delete

echo "All backups done: $DATE"
