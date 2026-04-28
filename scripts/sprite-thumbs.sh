#!/bin/bash
# Convert per-frame thumb*.jpg files into a single sprite WebP + a versioned VTT.
#
# Usage: ./sprite-thumbs.sh "Folder Name In Bucket"
#
# Reads:  s3://6672/<folder>/thumbs/thumb*.jpg + thumbs.vtt
# Writes: s3://6672/<folder>/thumbs/storyboard.webp
#         s3://6672/<folder>/thumbs/storyboard.vtt   (uses #xywh= sprite cells)
# Deletes: old thumb*.jpg files (after successful upload)
#
# IMPORTANT: After running, update the DB so the episode's thumbnail_path
# points to "<folder>/thumbs/storyboard.vtt" instead of ".../thumbs.vtt".
# We use a NEW filename because pushr.io's CDN aggressively caches by
# pathname and won't refresh when we update the same file.

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 \"<Folder Name>\""
  exit 1
fi

FOLDER="$1"
BUCKET="6672"
S3_ENDPOINT="https://s3.eu-central.r-cdn.com"
COLUMNS=10

WORK=$(mktemp -d)
trap "rm -rf $WORK" EXIT
echo "[+] Working in $WORK"
echo "[+] Folder: $FOLDER"

AWS="docker run --rm -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY -v $WORK:/work amazon/aws-cli --endpoint-url $S3_ENDPOINT"
IMG="docker run --rm -v $WORK:/work --entrypoint sh dpokidov/imagemagick"
# pushr.io's S3 endpoint corrupts uploads via aws-cli (leaks chunked-encoding header
# into the file body). MinIO's mc uses a different upload path that works correctly.
MC="docker run --rm --entrypoint sh -v $WORK:/work minio/mc"

# 1. Download source VTT and individual thumbs
echo "[+] Downloading source thumbs.vtt..."
$AWS s3 cp "s3://$BUCKET/$FOLDER/thumbs/thumbs.vtt" /work/source.vtt --quiet

echo "[+] Downloading thumb*.jpg files..."
$AWS s3 sync "s3://$BUCKET/$FOLDER/thumbs/" /work/thumbs/ --exclude "*" --include "thumb*.jpg" --quiet

THUMB_COUNT=$(ls -1 "$WORK/thumbs/"thumb*.jpg 2>/dev/null | wc -l)
if [ "$THUMB_COUNT" -lt 2 ]; then
  echo "[!] Only $THUMB_COUNT thumb files found - nothing to sprite (or already done)."
  exit 0
fi
echo "[+] Got $THUMB_COUNT thumbnails"

# 2. Detect dimensions
FIRST=$(ls -1 "$WORK/thumbs/"thumb*.jpg | head -1)
DIMS=$(docker run --rm -v "$WORK:/work" -w /work --entrypoint identify dpokidov/imagemagick "${FIRST#$WORK/}" | awk '{print $3}')
THUMB_W=$(echo "$DIMS" | cut -dx -f1)
THUMB_H=$(echo "$DIMS" | cut -dx -f2)
echo "[+] Source thumb size: ${THUMB_W}x${THUMB_H}"

ROWS=$(( (THUMB_COUNT + COLUMNS - 1) / COLUMNS ))
echo "[+] Sprite layout: ${COLUMNS}x${ROWS}"

# 3. Build sprite as WebP (pushr.io's CDN errors on big JPGs)
echo "[+] Building sprite (storyboard.webp)..."
$IMG -c "cd /work/thumbs && montage thumb*.jpg -tile ${COLUMNS}x${ROWS} -geometry +0+0 -background black -quality 85 /work/storyboard.webp"

SPRITE_SIZE=$(stat -c %s "$WORK/storyboard.webp")
echo "[+] Sprite built: $((SPRITE_SIZE / 1024)) KB"

# 4. Generate new VTT referencing sprite cells
echo "[+] Generating storyboard.vtt..."
WORK="$WORK" THUMB_W="$THUMB_W" THUMB_H="$THUMB_H" COLUMNS="$COLUMNS" python3 <<'PYEOF'
import os, re

work = os.environ['WORK']
thumb_w = int(os.environ['THUMB_W'])
thumb_h = int(os.environ['THUMB_H'])
cols = int(os.environ['COLUMNS'])

with open(f'{work}/source.vtt') as f:
    src = f.read()

cues = re.split(r'\n\n+', src.strip())
out = ['WEBVTT', '']
idx = 0

for cue in cues:
    if cue == 'WEBVTT' or not cue.strip():
        continue
    lines = [l for l in cue.split('\n') if l.strip()]
    time_line = next((l for l in lines if '-->' in l), None)
    if not time_line:
        continue
    col = idx % cols
    row = idx // cols
    x = col * thumb_w
    y = row * thumb_h
    out.append(time_line)
    out.append(f'storyboard.webp#xywh={x},{y},{thumb_w},{thumb_h}')
    out.append('')
    idx += 1

with open(f'{work}/storyboard.vtt', 'w') as f:
    f.write('\n'.join(out))
print(f'  wrote {idx} cues')
PYEOF

# 5. Upload using mc (aws-cli corrupts uploads on pushr.io's S3)
echo "[+] Uploading storyboard.webp + storyboard.vtt via mc..."
$MC -c "mc alias set s3 $S3_ENDPOINT $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY --api S3v2 >/dev/null && \
  mc cp --attr 'Content-Type=image/webp;Cache-Control=public, max-age=31536000' /work/storyboard.webp \"s3/$BUCKET/$FOLDER/thumbs/storyboard.webp\" >/dev/null && \
  mc cp --attr 'Content-Type=text/vtt;Cache-Control=public, max-age=300' /work/storyboard.vtt \"s3/$BUCKET/$FOLDER/thumbs/storyboard.vtt\" >/dev/null"

# 6. Delete old individual thumbs
echo "[+] Deleting old thumb*.jpg files..."
DELETED=$($AWS s3 rm "s3://$BUCKET/$FOLDER/thumbs/" --recursive --exclude "*" --include "thumb*.jpg" 2>&1 | wc -l)
echo "    deleted $DELETED files"

echo ""
echo "[done] $FOLDER"
echo "    Old: $THUMB_COUNT separate JPG files"
echo "    New: 1 storyboard.webp ($((SPRITE_SIZE / 1024)) KB) + 1 storyboard.vtt"
echo ""
echo "Next: update DB - thumbnail_path = '$FOLDER/thumbs/storyboard.vtt'"
