#!/bin/bash
# Re-extract thumbnails from a video on the CDN, then build a sprite sheet.
# Use when individual thumb*.jpg files were already deleted.
#
# Usage: ./reextract-thumbs.sh "Folder Name In Bucket"

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 \"<Folder Name>\""
  exit 1
fi

FOLDER="$1"
BUCKET="6672"
S3_ENDPOINT="https://s3.eu-central.r-cdn.com"
CDN_BASE="https://c6149z6672.r-cdn.com"
COLUMNS=10

WORK=$(mktemp -d)
trap "rm -rf $WORK" EXIT
echo "[+] Working in $WORK"
echo "[+] Folder: $FOLDER"

FOLDER_URL=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$FOLDER'))")

# 1. Extract one frame every 10 seconds from the 720p HLS as 160x90 JPGs
echo "[+] Extracting thumbnails via ffmpeg from 720p stream..."
docker run --rm -v "$WORK:/work" --entrypoint ffmpeg jrottenberg/ffmpeg:7.1-alpine \
  -hide_banner -loglevel warning \
  -i "$CDN_BASE/$FOLDER_URL/720/index.m3u8" \
  -vf "fps=1/10,scale=160:90" -q:v 4 \
  /work/thumb%04d.jpg

THUMB_COUNT=$(ls -1 "$WORK/"thumb*.jpg 2>/dev/null | wc -l)
if [ "$THUMB_COUNT" -lt 2 ]; then
  echo "[!] ffmpeg produced $THUMB_COUNT thumbs - aborting"
  exit 1
fi
echo "[+] Extracted $THUMB_COUNT thumbnails"

ROWS=$(( (THUMB_COUNT + COLUMNS - 1) / COLUMNS ))
echo "[+] Sprite layout: ${COLUMNS}x${ROWS}"

# 2. Build sprite (in same dir as thumbs)
mkdir -p "$WORK/thumbs"
mv "$WORK/"thumb*.jpg "$WORK/thumbs/"
echo "[+] Building sprite..."
docker run --rm -v "$WORK:/work" --entrypoint sh dpokidov/imagemagick \
  -c "cd /work/thumbs && montage thumb*.jpg -tile ${COLUMNS}x${ROWS} -geometry +0+0 -background black -quality 85 /work/storyboard.webp"

SPRITE_SIZE=$(stat -c %s "$WORK/storyboard.webp")
echo "[+] Sprite built: $((SPRITE_SIZE / 1024)) KB"

# 3. Generate VTT
echo "[+] Generating storyboard.vtt..."
WORK="$WORK" THUMB_W=160 THUMB_H=90 COLUMNS="$COLUMNS" THUMB_COUNT="$THUMB_COUNT" python3 <<'PYEOF'
import os
work = os.environ['WORK']
thumb_w = int(os.environ['THUMB_W'])
thumb_h = int(os.environ['THUMB_H'])
cols = int(os.environ['COLUMNS'])
count = int(os.environ['THUMB_COUNT'])

out = ['WEBVTT', '']
for i in range(count):
    start = i * 10
    end = start + 10
    sh, sm, ss = start // 3600, (start % 3600) // 60, start % 60
    eh, em, es = end // 3600, (end % 3600) // 60, end % 60
    col = i % cols
    row = i // cols
    out.append(f'{sh:02d}:{sm:02d}:{ss:02d}.000 --> {eh:02d}:{em:02d}:{es:02d}.000')
    out.append(f'storyboard.webp#xywh={col*thumb_w},{row*thumb_h},{thumb_w},{thumb_h}')
    out.append('')

with open(f'{work}/storyboard.vtt', 'w') as f:
    f.write('\n'.join(out))
print(f'  wrote {count} cues')
PYEOF

# 4. Upload via mc (aws-cli corrupts uploads on this S3)
echo "[+] Uploading via mc..."
docker run --rm --entrypoint sh -v "$WORK:/work" minio/mc -c \
  "mc alias set s3 $S3_ENDPOINT $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY --api S3v2 >/dev/null && \
   mc cp --attr 'Content-Type=image/webp;Cache-Control=public, max-age=31536000' /work/storyboard.webp \"s3/$BUCKET/$FOLDER/thumbs/storyboard.webp\" >/dev/null && \
   mc cp --attr 'Content-Type=text/vtt;Cache-Control=public, max-age=300' /work/storyboard.vtt \"s3/$BUCKET/$FOLDER/thumbs/storyboard.vtt\" >/dev/null"

echo ""
echo "[done] $FOLDER"
echo "    Re-extracted: $THUMB_COUNT thumbs"
echo "    Uploaded: 1 storyboard.webp ($((SPRITE_SIZE / 1024)) KB) + 1 storyboard.vtt"
