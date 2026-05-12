# cdn-worker

Cloudflare Worker that fronts the `hentai-bucket` R2 bucket on
`cdn.hentaiclick.tv`. This is production code — runs on Cloudflare's
edge, not bundled with the Next app.

## What it does

- **Hotlink protection** via Referer header (matches what pushr did)
- **`.mkv` downloads gated by signed URLs** — HMAC-SHA256 signature
  + 5-min expiry, minted by `/api/download` on the VPS after auth +
  quota checks. The VPS never sees the file body; downloads stream
  browser ↔ Cloudflare edge ↔ R2.
- **`Content-Disposition: attachment`** auto-injected for `.mkv` so
  browsers don't try to inline-play a multi-GB MKV
- **HTTP Range** for video seek + download resume (206 Partial Content)
- **CORS** for HLS.js cross-origin segment fetches
- **Tiered caching**: `.m3u8` → 5 min, `.vtt` → 1 hr, segments / `.mkv`
  / images → 1 year + `immutable`
- **`/__migrate`** admin endpoint that streams pushr → R2 via the R2
  binding (one-shot during migration; still works for any future
  pushr→R2 transfers if needed)

## Bindings required at deploy time

| Name | Type | Purpose |
| --- | --- | --- |
| `BUCKET` | `r2_bucket` | The R2 bucket (`hentai-bucket`) |
| `MIGRATE_TOKEN` | `secret_text` | Bearer secret for `/__migrate` |
| `SIGNED_URL_SECRET` | `secret_text` | HMAC secret for `.mkv` signed URLs — **must match** `SIGNED_URL_SECRET` in the Next app's env |

## Deploy

The deploy uses Cloudflare's Workers API (multipart upload). The
`metadata` part declares bindings and the `compatibility_date`. Token
needs Workers Script Edit + R2 Edit scopes.

```sh
# Build metadata
cat > /tmp/worker-meta.json <<EOF
{
  "main_module": "cdn-worker.js",
  "compatibility_date": "2025-08-01",
  "bindings": [
    { "type": "r2_bucket",  "name": "BUCKET",            "bucket_name": "hentai-bucket" },
    { "type": "secret_text","name": "MIGRATE_TOKEN",     "text": "$MIGRATE_TOKEN" },
    { "type": "secret_text","name": "SIGNED_URL_SECRET", "text": "$SIGNED_URL_SECRET" }
  ]
}
EOF

# Upload
curl -X PUT \
  -H "Authorization: Bearer $CF_TOKEN" \
  -F "metadata=@/tmp/worker-meta.json;type=application/json" \
  -F "cdn-worker.js=@cdn-worker.js;type=application/javascript+module" \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/hentai-cdn"
```

After deploying, the Worker is bound to the route `cdn.hentaiclick.tv/*`
(configured separately under Workers Routes; not in this file).

## Local sanity-test

```sh
# Streaming segment — no signature required, only a valid Referer
curl -sI 'https://cdn.hentaiclick.tv/<series>/720/seg_000.m4s' \
  -H 'Referer: https://hentaiclick.tv/'         # → 200

# MKV without signature — should 403
curl -sI 'https://cdn.hentaiclick.tv/<series>/1080p_full.mkv'  # → 403

# Tampered signature — should 403
curl -sI 'https://cdn.hentaiclick.tv/<series>/1080p_full.mkv?exp=99999999999999&sig=deadbeef'  # → 403

# Expired exp — should 410
# (build with exp=$(($(date +%s)-60))*1000)

# Valid signature — should 206 on Range, 200 on full GET
# (mint via the same HMAC the Next /api/download endpoint uses)
```
