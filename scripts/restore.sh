#!/bin/bash
# HentaiClick DB Restore Script
# Usage: ./restore.sh /home/backups/db_2026-03-20_02-00-00.sql.gz

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -lh /home/backups/db_*.sql.gz 2>/dev/null
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: File $BACKUP_FILE not found"
    exit 1
fi

echo "WARNING: This will overwrite the current database!"
echo "Restoring from: $BACKUP_FILE"
read -p "Continue? (y/N): " confirm
if [ "$confirm" != "y" ]; then
    echo "Aborted."
    exit 0
fi

echo "Restoring database..."
gunzip -c "$BACKUP_FILE" | docker exec -i supabase-db psql -U supabase_admin -d postgres
echo "Restore complete."
