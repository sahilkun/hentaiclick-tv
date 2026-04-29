#!/bin/bash
# Generate a small (480x270) card.webp thumbnail for an existing episode by
# resizing its existing gallery_0.webp. Updates DB to point thumbnail_url
# to the new file.
#
# Usage: ./generate-card-thumbs.sh "Folder Name In Bucket"

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 \"<Folder Name>\""
  exit 1
fi

FOLDER="$1"
BUCKET="6672"
S3_ENDPOINT="https://s3.eu-central.r-cdn.com"
CDN_BASE="https://c6149z6672.r-cdn.com"

WORK=$(mktemp -d)
trap "rm -rf $WORK" EXIT
echo "[+] $FOLDER"

# 1. Download existing gallery_0
docker run --rm -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  -v "$WORK:/work" amazon/aws-cli --endpoint-url "$S3_ENDPOINT" \
  s3 cp "s3://$BUCKET/$FOLDER/gallery/gallery_0.webp" /work/src.webp --quiet

# 2. Resize to 480x270 with ImageMagick
docker run --rm -v "$WORK:/work" --entrypoint sh dpokidov/imagemagick \
  -c "convert /work/src.webp -resize 480x270 -define webp:method=6 -quality 80 /work/card.webp"

CARD_SIZE=$(stat -c %s "$WORK/card.webp")
SRC_SIZE=$(stat -c %s "$WORK/src.webp")
echo "  [+] resized $((SRC_SIZE / 1024)) KB -> $((CARD_SIZE / 1024)) KB"

# 3. Upload via mc (aws-cli corrupts uploads on pushr.io)
docker run --rm --entrypoint sh -v "$WORK:/work" minio/mc -c \
  "mc alias set s3 $S3_ENDPOINT $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY --api S3v2 >/dev/null && \
   mc cp --attr 'Content-Type=image/webp;Cache-Control=public, max-age=31536000' /work/card.webp \"s3/$BUCKET/$FOLDER/card.webp\" >/dev/null"

echo "  [done] uploaded s3/$BUCKET/$FOLDER/card.webp"
