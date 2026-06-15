#!/bin/bash
BACKUP_DIR="/home/berkah/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/db_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

docker compose -f /home/berkah/PBL_206/docker-compose.yml exec -T db \
  mysqldump -u root -p${MYSQL_ROOT_PASSWORD} db_praktikum | gzip > $FILE

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup done: $FILE"
