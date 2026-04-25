#!/bin/bash
# HentaiClick DB Backup Script
# Backs up Supabase Postgres and Meilisearch data
# Encrypted with GPG symmetric (AES-256)
# Retention: 7 days

BACKUP_DIR=/home/backups
DATE=$(date +%Y-%m-%d_%H-%M-%S)
RETENTION_DAYS=7

# Encryption passphrase (set in /root/.backup_passphrase)
PASSPHRASE_FILE=/root/.backup_passphrase
if [ ! -f "$PASSPHRASE_FILE" ]; then
    echo "[$DATE] ERROR: No passphrase file at $PASSPHRASE_FILE"
    echo "[$DATE] Create one with: openssl rand -base64 32 > $PASSPHRASE_FILE && chmod 600 $PASSPHRASE_FILE"
    exit 1
fi

echo "[$DATE] Starting backup..."

# Postgres backup (encrypted)
docker exec supabase-db pg_dump -U supabase_admin -d postgres --clean --if-exists | gzip | \
    gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-file "$PASSPHRASE_FILE" \
    -o "$BACKUP_DIR/db_$DATE.sql.gz.gpg"
DB_SIZE=$(du -sh "$BACKUP_DIR/db_$DATE.sql.gz.gpg" | cut -f1)
echo "[$DATE] DB backup (encrypted): $DB_SIZE"

# Meilisearch dump
MEILI_KEY=$(grep MEILISEARCH_ADMIN_KEY /opt/hentaiclick/.env.production | cut -d= -f2)
docker exec hentaiclick-meilisearch-1 wget -qO- --method=POST --header="Authorization: Bearer $MEILI_KEY" http://127.0.0.1:7700/dumps > /dev/null 2>&1
sleep 5
docker cp hentaiclick-meilisearch-1:/meili_data/dumps/ /tmp/meili_dumps 2>/dev/null
if [ -d /tmp/meili_dumps ]; then
    tar czf - -C /tmp meili_dumps | \
        gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-file "$PASSPHRASE_FILE" \
        -o "$BACKUP_DIR/meilisearch_$DATE.tar.gz.gpg"
    rm -rf /tmp/meili_dumps
    MS_SIZE=$(du -sh "$BACKUP_DIR/meilisearch_$DATE.tar.gz.gpg" | cut -f1)
    echo "[$DATE] Meilisearch backup (encrypted): $MS_SIZE"
fi

# Delete old backups
find "$BACKUP_DIR" -name "db_*.sql.gz.gpg" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "meilisearch_*.tar.gz.gpg" -mtime +$RETENTION_DAYS -delete
# Also clean any old unencrypted backups
find "$BACKUP_DIR" -name "db_*.sql.gz" -not -name "*.gpg" -delete
find "$BACKUP_DIR" -name "meilisearch_*.tar.gz" -not -name "*.gpg" -delete
echo "[$DATE] Cleaned backups older than $RETENTION_DAYS days + unencrypted leftovers"

# Prune old download_events rows (>7 days old) to keep the table small
PRUNED=$(docker exec supabase-db psql -U supabase_admin -d postgres -tAc "WITH d AS (DELETE FROM download_events WHERE created_at < now() - interval '7 days' RETURNING 1) SELECT COUNT(*) FROM d" 2>/dev/null | tr -d '[:space:]')
echo "[$DATE] Pruned ${PRUNED:-0} old download_events rows"

echo "[$DATE] Backup complete."
# To decrypt: gpg --batch --passphrase-file /root/.backup_passphrase -d backup.sql.gz.gpg > backup.sql.gz
