#!/bin/bash
# bulk-migrate.sh — Iterate over the episode list in $1 and call
# migrate-one-episode.sh for each. Logs each run, accumulates a master
# summary, and skips episodes that already have a "DONE" stamp file so
# re-running picks up where we left off.
#
# Usage: bulk-migrate.sh /path/to/episode-list.txt
#   episode-list.txt has one folder name per line (e.g.
#   "Honey Blonde 2 - 02")
#
# Required env: AKEY, SKEY, CF_TOKEN, ACCOUNT_ID, MIGRATE_TOKEN

set -uo pipefail

if [ $# -ne 1 ] || [ ! -f "$1" ]; then
  echo "Usage: $0 episode-list.txt" >&2
  exit 2
fi

LIST="$1"
STATE_DIR="/var/lib/r2-migration"
mkdir -p "$STATE_DIR"
MASTER_LOG="${STATE_DIR}/master.log"

TOTAL=$(wc -l < "$LIST")
DONE_BEFORE=$(ls "$STATE_DIR"/*.done 2>/dev/null | wc -l)

echo "=== Bulk migration started: $(date) ===" | tee -a "$MASTER_LOG"
echo "Episodes in list: $TOTAL (already done: $DONE_BEFORE)" | tee -a "$MASTER_LOG"

i=0
while IFS= read -r episode; do
  i=$((i + 1))
  if [ -z "$episode" ]; then continue; fi

  safe="${episode// /-}"
  stamp="${STATE_DIR}/${safe}.done"
  log="${STATE_DIR}/${safe}.log"

  if [ -f "$stamp" ]; then
    echo "[$i/$TOTAL] $(date +%T) SKIP already-done: $episode" | tee -a "$MASTER_LOG"
    continue
  fi

  echo "[$i/$TOTAL] $(date +%T) START: $episode" | tee -a "$MASTER_LOG"
  start_ts=$(date +%s)

  if bash /tmp/migrate-one-episode.sh "$episode" > "$log" 2>&1; then
    end_ts=$(date +%s)
    elapsed=$((end_ts - start_ts))
    summary=$(grep -E '^=== .* done ' "$log" | tail -1)
    echo "[$i/$TOTAL] $(date +%T) OK (${elapsed}s): $summary" | tee -a "$MASTER_LOG"
    touch "$stamp"
  else
    end_ts=$(date +%s)
    elapsed=$((end_ts - start_ts))
    summary=$(grep -E '^=== .* done ' "$log" | tail -1)
    fails=$(grep -cE 'FETCH-FAIL|UPLOAD-FAIL|WORKER-FAIL' "$log" 2>/dev/null || echo "?")
    echo "[$i/$TOTAL] $(date +%T) FAIL (${elapsed}s, $fails fails): $episode — log: $log" | tee -a "$MASTER_LOG"
    # Continue with next episode — don't abort the whole batch on one failure.
  fi
done < "$LIST"

echo "=== Bulk migration done: $(date) ===" | tee -a "$MASTER_LOG"
done_after=$(ls "$STATE_DIR"/*.done 2>/dev/null | wc -l)
echo "Episodes complete: $done_after / $TOTAL" | tee -a "$MASTER_LOG"
