#!/bin/bash
# HentaiClick DB Backup Script
# Backs up Supabase Postgres and Meilisearch data
# Retention: 30 days

BACKUP_DIR=/home/backups
DATE=$(date +%Y-%m-%d_%H-%M-%S)
RETENTION_DAYS=30

echo "[$DATE] Starting backup..."

# Postgres backup
docker exec supabase-db pg_dump -U supabase_admin -d postgres --clean --if-exists | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"
DB_SIZE=$(du -sh "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1)
echo "[$DATE] DB backup: $DB_SIZE"

# Meilisearch dump
docker exec hentaiclick-meilisearch-1 wget -qO- --method=POST --header='Authorization: Bearer masterKey1234567890' http://127.0.0.1:7700/dumps > /dev/null 2>&1
sleep 5
# Copy meilisearch data volume
docker cp hentaiclick-meilisearch-1:/meili_data/dumps/ /tmp/meili_dumps 2>/dev/null
if [ -d /tmp/meili_dumps ]; then
    tar czf "$BACKUP_DIR/meilisearch_$DATE.tar.gz" -C /tmp meili_dumps
    rm -rf /tmp/meili_dumps
    MS_SIZE=$(du -sh "$BACKUP_DIR/meilisearch_$DATE.tar.gz" | cut -f1)
    echo "[$DATE] Meilisearch backup: $MS_SIZE"
fi

# Delete old backups
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "meilisearch_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "[$DATE] Cleaned backups older than $RETENTION_DAYS days"

echo "[$DATE] Backup complete."
