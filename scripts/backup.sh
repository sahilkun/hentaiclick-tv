#!/bin/bash
# =============================================================================
# HentaiClick TV — Daily Backup Script
# Backs up: Supabase DB, MeiliSearch data, environment config
# Storage: /home/backups/ with 30-day rotation
# =============================================================================

set -euo pipefail

# --- Configuration ---
BACKUP_ROOT="/home/backups"
RETENTION_DAYS=30
DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_DIR="$BACKUP_ROOT/$DATE"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load env vars from .env.local
if [ -f "$PROJECT_DIR/.env.local" ]; then
  set -a
  source "$PROJECT_DIR/.env.local"
  set +a
fi

# Required vars
DB_URL="${DATABASE_URL:-}"
MEILI_HOST="${NEXT_PUBLIC_MEILISEARCH_HOST:-http://localhost:7700}"
MEILI_KEY="${MEILISEARCH_ADMIN_KEY:-}"

# --- Setup ---
mkdir -p "$BACKUP_DIR"
LOG_FILE="$BACKUP_DIR/backup.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "======================================"
echo "Backup started: $(date)"
echo "Backup dir: $BACKUP_DIR"
echo "======================================"

# --- 1. Supabase Database ---
echo ""
echo "[1/3] Backing up Supabase database..."
if [ -n "$DB_URL" ]; then
  pg_dump "$DB_URL" --no-owner --no-privileges --format=custom \
    -f "$BACKUP_DIR/database.dump" 2>&1

  # Also create a plain SQL version
  pg_dump "$DB_URL" --no-owner --no-privileges \
    -f "$BACKUP_DIR/database.sql" 2>&1

  echo "  -> database.dump ($(du -h "$BACKUP_DIR/database.dump" | cut -f1))"
  echo "  -> database.sql ($(du -h "$BACKUP_DIR/database.sql" | cut -f1))"
else
  echo "  -> SKIPPED: DATABASE_URL not set in .env.local"
  echo "     Add: DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"
fi

# --- 2. MeiliSearch ---
echo ""
echo "[2/3] Backing up MeiliSearch..."
if [ -n "$MEILI_KEY" ]; then
  # Trigger a dump
  DUMP_RESPONSE=$(curl -s -X POST "$MEILI_HOST/dumps" \
    -H "Authorization: Bearer $MEILI_KEY" 2>&1) || true

  TASK_UID=$(echo "$DUMP_RESPONSE" | grep -o '"taskUid":[0-9]*' | grep -o '[0-9]*' || echo "")

  if [ -n "$TASK_UID" ]; then
    echo "  -> Dump task created (taskUid: $TASK_UID)"

    # Wait for dump to complete (max 60 seconds)
    for i in $(seq 1 12); do
      sleep 5
      STATUS=$(curl -s "$MEILI_HOST/tasks/$TASK_UID" \
        -H "Authorization: Bearer $MEILI_KEY" 2>&1) || true

      if echo "$STATUS" | grep -q '"status":"succeeded"'; then
        echo "  -> Dump completed successfully"
        break
      elif echo "$STATUS" | grep -q '"status":"failed"'; then
        echo "  -> Dump failed"
        break
      fi
    done

    # Copy dump from Docker volume if running in Docker
    CONTAINER=$(docker ps --filter "ancestor=getmeili/meilisearch" --format "{{.ID}}" 2>/dev/null | head -1) || true
    if [ -n "$CONTAINER" ]; then
      docker cp "$CONTAINER:/meili_data/dumps/" "$BACKUP_DIR/meilisearch/" 2>&1 || true
      echo "  -> Copied dumps from container"
    else
      echo "  -> Note: Copy dumps manually from MeiliSearch data directory"
    fi
  else
    echo "  -> Failed to create dump: $DUMP_RESPONSE"
  fi
else
  echo "  -> SKIPPED: MEILISEARCH_ADMIN_KEY not set"
fi

# --- 3. Environment Config ---
echo ""
echo "[3/3] Backing up configuration..."
if [ -f "$PROJECT_DIR/.env.local" ]; then
  cp "$PROJECT_DIR/.env.local" "$BACKUP_DIR/.env.local"
  echo "  -> .env.local copied"
fi

# --- Rotation: Delete backups older than RETENTION_DAYS ---
echo ""
echo "Rotating old backups (keeping last $RETENTION_DAYS days)..."
DELETED=0
if [ -d "$BACKUP_ROOT" ]; then
  find "$BACKUP_ROOT" -maxdepth 1 -mindepth 1 -type d -mtime +$RETENTION_DAYS | while read dir; do
    rm -rf "$dir"
    echo "  -> Deleted: $(basename "$dir")"
    DELETED=$((DELETED + 1))
  done
fi
echo "  -> Cleaned up old backups"

# --- Summary ---
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo ""
echo "======================================"
echo "Backup completed: $(date)"
echo "Total size: $TOTAL_SIZE"
echo "Location: $BACKUP_DIR"
echo "======================================"
