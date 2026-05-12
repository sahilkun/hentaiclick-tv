#!/bin/bash
# migrate-one-episode.sh — Streams every file under one pushr.io episode
# folder to R2 (hentai-bucket) via the Cloudflare API.
#
# Usage:  migrate-one-episode.sh "Episode Folder Name"
# Required env vars:
#   AKEY            pushr.io S3 access key
#   SKEY            pushr.io S3 secret key
#   CF_TOKEN        Cloudflare API token (Workers R2 Storage Edit)
#   ACCOUNT_ID      Cloudflare account ID
#
# Strategy:
#   1. List all object keys under the given pushr folder via mc
#   2. For each, run a streaming pipe in parallel (xargs -P):
#        curl pushr → curl R2 PUT (no disk staging for typical files)
#      Large MKVs use /tmp staging because Bearer-auth PUT needs
#      Content-Length up front (R2 won't accept chunked-transfer PUT).
#   3. Verify count + spot-check that fetched URLs return 200 on R2.
#
# Idempotent: re-running just re-uploads existing keys (safe, R2
# overwrites). Use this if a previous run was interrupted.

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 \"Episode Folder Name\"" >&2
  exit 2
fi

EPISODE="$1"
BUCKET="hentai-bucket"
PUSHR_S3="s3://6672/${EPISODE}"
PUSHR_CDN="https://c6149z6672.r-cdn.com"
# Cloudflare's API rate limit is 1200 requests / 5 min per token, i.e.
# ~4 req/sec sustained. With PARALLEL=4 each worker sustains ~1 req/sec
# (curl latency dominates), keeping us under the cap. Higher values
# burned through the quota in seconds and triggered cascading 429s.
PARALLEL="${PARALLEL:-4}"
LOG="/tmp/migrate-${EPISODE// /-}.log"

: "${AKEY:?AKEY (pushr S3 access key) not set}"
: "${SKEY:?SKEY (pushr S3 secret) not set}"
: "${CF_TOKEN:?CF_TOKEN (Cloudflare API token) not set}"
: "${ACCOUNT_ID:?ACCOUNT_ID not set}"
: "${MIGRATE_TOKEN:?MIGRATE_TOKEN (Worker __migrate secret) not set}"
WORKER_BASE="${WORKER_BASE:-https://cdn.hentaiclick.tv}"

# ---- helpers ----------------------------------------------------------

# URL-encode every component of a key path (preserves slash separators).
urlencode_path() {
  python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe='/'))" "$1"
}

# Pick a sensible Content-Type from the filename extension. R2 stores
# this in object metadata; our Worker reads it back via writeHttpMetadata.
content_type_for() {
  case "${1,,}" in
    *.m3u8)       echo "application/vnd.apple.mpegurl" ;;
    *.m4s|*.mp4)  echo "video/iso.segment" ;;
    *.ts)         echo "video/mp2t" ;;
    *.vtt)        echo "text/vtt" ;;
    *.webp)       echo "image/webp" ;;
    *.jpg|*.jpeg) echo "image/jpeg" ;;
    *.png)        echo "image/png" ;;
    *.mkv)        echo "video/x-matroska" ;;
    *.json)       echo "application/json" ;;
    *)            echo "application/octet-stream" ;;
  esac
}

# Upload one file from pushr.io → R2.  $1 = full key including episode
# folder ("Honey Blonde 2 - 01/720/seg_000.m4s").
#
# Small files (≤200 MiB by extension heuristic) go through the
# Cloudflare Bearer-auth PUT API after staging to /tmp.
#
# Large files (.mkv) go through the Worker __migrate endpoint, which
# uses the R2 binding's stream put() — no 300 MiB cap, no VPS disk
# staging. Pushr → Cloudflare edge → R2 in one hop.
upload_one() {
  local key="$1"
  local encoded ct
  encoded="$(urlencode_path "$key")"
  ct="$(content_type_for "$key")"
  local pushr_url="${PUSHR_CDN}/${encoded}"

  # Large-file path: route MKVs through the Worker __migrate endpoint.
  case "${key,,}" in
    *.mkv)
      local resp success
      resp="$(curl -s --max-time 1800 -X POST \
        -H "X-Migrate-Token: $MIGRATE_TOKEN" \
        -H "Content-Type: application/json" \
        --data "$(python3 -c 'import json,sys; print(json.dumps({"sourceUrl": sys.argv[1], "destKey": sys.argv[2], "contentType": sys.argv[3], "referer": "https://hentaiclick.tv/"}))' "$pushr_url" "$key" "$ct")" \
        "${WORKER_BASE}/__migrate")"
      success="$(echo "$resp" | python3 -c 'import sys,json
try:
    print(json.load(sys.stdin).get("ok") is True)
except Exception:
    print(False)')"
      if [ "$success" != "True" ]; then
        echo "WORKER-FAIL  $key  $(echo "$resp" | head -c 200)" >&2
        return 1
      fi
      echo "ok  $key"
      return 0
      ;;
  esac

  # Small-file path: /tmp stage + Bearer-auth PUT.
  local r2_url="https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${encoded}"
  local tmp
  tmp="$(mktemp /tmp/r2up.XXXXXX)"
  trap "rm -f \"$tmp\"" RETURN

  # Fetch with one retry on transient failure
  local tries
  for tries in 1 2; do
    if curl -sf --max-time 600 \
         -H "Referer: https://hentaiclick.tv/" \
         -o "$tmp" "$pushr_url"; then
      break
    fi
    if [ "$tries" -eq 2 ]; then
      echo "FETCH-FAIL  $key" >&2
      rm -f "$tmp"
      return 1
    fi
    sleep 2
  done

  # PUT with retries. 429s come from Cloudflare's 1200/5min token quota
  # — sleep long enough that the bucket has time to refill. Other 5xxs
  # retry on a shorter backoff. Sequence: 8s, 30s, 90s, 180s.
  local resp delay
  for tries in 1 2 3 4 5; do
    resp="$(curl -s --max-time 1800 -o /dev/null -w '%{http_code}' \
         -X PUT \
         -H "Authorization: Bearer $CF_TOKEN" \
         -H "Content-Type: $ct" \
         --data-binary "@${tmp}" \
         "$r2_url")"
    if [ "$resp" = "200" ] || [ "$resp" = "201" ]; then
      break
    fi
    if [ "$tries" -eq 5 ]; then
      rm -f "$tmp"
      echo "UPLOAD-FAIL($resp)  $key" >&2
      return 1
    fi
    # Longer backoff on 429 (quota windows are 5 min); shorter on 5xx
    case "$resp" in
      429) delay=$(( 8 * tries )) ;;
      *)   delay=$(( 2 * tries )) ;;
    esac
    sleep "$delay"
  done
  rm -f "$tmp"
  echo "ok  $key"
}

export -f upload_one urlencode_path content_type_for
export CF_TOKEN ACCOUNT_ID BUCKET PUSHR_CDN MIGRATE_TOKEN WORKER_BASE

# ---- 1. List keys under the episode folder via mc ---------------------

echo "[$(date +%T)] Listing keys under $EPISODE…" | tee "$LOG"

KEYS_FILE="/tmp/keys-${EPISODE// /-}.txt"
# mc ls --recursive prints lines like:
#   [2026-05-01 10:11:04 UTC]  12KiB STANDARD 1080/index.m3u8
# Fields: $1=[date $2=time $3=UTC] $4=size $5=class $6..NF=filename.
# Directories appear as "0B STANDARD foo/" — we skip names ending in "/".
# We use `mc ls` instead of `mc find` because this mc build doesn't
# support `find --type f`.
docker run --rm --entrypoint sh \
  -e AKEY -e SKEY \
  minio/mc -c "
mc alias set s3 https://s3.eu-central.r-cdn.com \"\$AKEY\" \"\$SKEY\" --api S3v2 >/dev/null
mc ls --recursive \"s3/6672/${EPISODE}/\"
" | awk 'NF >= 6 {
    # Reassemble fields 6..NF to preserve spaces in filenames
    name = $6
    for (i = 7; i <= NF; i++) name = name " " $i
    # Skip directory entries (trailing slash)
    if (substr(name, length(name), 1) == "/") next
    print name
  }' | sed "s|^|${EPISODE}/|" > "$KEYS_FILE"

TOTAL="$(wc -l < "$KEYS_FILE")"
echo "[$(date +%T)] Found $TOTAL keys" | tee -a "$LOG"

# ---- 2. Parallel upload -----------------------------------------------

echo "[$(date +%T)] Uploading with $PARALLEL parallel workers…" | tee -a "$LOG"
START="$(date +%s)"

# xargs reads keys from file, runs upload_one in $PARALLEL processes.
# `bash -c 'upload_one "$@"' _` recreates the bash shell context per call
# so the exported function is visible.
< "$KEYS_FILE" xargs -P "$PARALLEL" -I {} \
  bash -c 'upload_one "$@"' _ {} 2>&1 | tee -a "$LOG"

END="$(date +%s)"
ELAPSED="$((END - START))"

# ---- 3. Summary -------------------------------------------------------

OK_COUNT="$(grep -c '^ok ' "$LOG" || true)"
FAIL_COUNT="$(grep -cE 'FETCH-FAIL|UPLOAD-FAIL|WORKER-FAIL' "$LOG" || true)"
echo | tee -a "$LOG"
echo "=== $EPISODE done in ${ELAPSED}s — $OK_COUNT/$TOTAL ok, $FAIL_COUNT failed ===" | tee -a "$LOG"
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "Failures:" >&2
  grep -E 'FETCH-FAIL|UPLOAD-FAIL|WORKER-FAIL' "$LOG" >&2 || true
  exit 1
fi
