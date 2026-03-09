#!/bin/bash
# =============================================================================
# HentaiClick TV — Restore Script
# Restores database from a backup directory
# Usage: ./scripts/restore.sh /home/backups/2026-03-09_02-00
# =============================================================================

set -euo pipefail

BACKUP_DIR="${1:-}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "$BACKUP_DIR" ] || [ ! -d "$BACKUP_DIR" ]; then
  echo "Usage: $0 <backup-directory>"
  echo ""
  echo "Available backups:"
  ls -1d /home/backups/*/ 2>/dev/null || echo "  No backups found in /home/backups/"
  exit 1
fi

# Load env vars
if [ -f "$PROJECT_DIR/.env.local" ]; then
  set -a
  source "$PROJECT_DIR/.env.local"
  set +a
fi

DB_URL="${DATABASE_URL:-}"
MEILI_HOST="${NEXT_PUBLIC_MEILISEARCH_HOST:-http://localhost:7700}"
MEILI_KEY="${MEILISEARCH_ADMIN_KEY:-}"

echo "======================================"
echo "Restore from: $BACKUP_DIR"
echo "======================================"

# --- 1. Database ---
if [ -f "$BACKUP_DIR/database.dump" ]; then
  echo ""
  read -p "[1] Restore database from backup? This will OVERWRITE current data. (y/N): " CONFIRM
  if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
    if [ -n "$DB_URL" ]; then
      pg_restore "$DB_URL" --no-owner --no-privileges --clean --if-exists \
        "$BACKUP_DIR/database.dump" 2>&1 || true
      echo "  -> Database restored"
    else
      echo "  -> ERROR: DATABASE_URL not set"
    fi
  else
    echo "  -> Skipped"
  fi
elif [ -f "$BACKUP_DIR/database.sql" ]; then
  echo ""
  read -p "[1] Restore database from SQL backup? This will OVERWRITE current data. (y/N): " CONFIRM
  if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
    if [ -n "$DB_URL" ]; then
      psql "$DB_URL" < "$BACKUP_DIR/database.sql" 2>&1 || true
      echo "  -> Database restored from SQL"
    else
      echo "  -> ERROR: DATABASE_URL not set"
    fi
  else
    echo "  -> Skipped"
  fi
else
  echo "[1] No database backup found in $BACKUP_DIR"
fi

# --- 2. MeiliSearch ---
if [ -d "$BACKUP_DIR/meilisearch" ]; then
  echo ""
  echo "[2] MeiliSearch dumps found."
  echo "    To restore, import the dump when starting MeiliSearch:"
  echo "    meilisearch --import-dump /path/to/dump.dump"
  echo ""
  ls -la "$BACKUP_DIR/meilisearch/"
else
  echo "[2] No MeiliSearch backup found"
fi

# --- 3. Env ---
if [ -f "$BACKUP_DIR/.env.local" ]; then
  echo ""
  read -p "[3] Restore .env.local? Current file will be overwritten. (y/N): " CONFIRM
  if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
    cp "$BACKUP_DIR/.env.local" "$PROJECT_DIR/.env.local"
    echo "  -> .env.local restored"
  else
    echo "  -> Skipped"
  fi
fi

echo ""
echo "======================================"
echo "Restore completed: $(date)"
echo "======================================"
