# r2-migration

One-shot tools that moved the catalog from pushr.io to Cloudflare R2 in
May 2026. Kept for historical reference and in case a future move (R2 →
something else) wants to re-use the orchestration.

## Files

- **`migrate-one-episode.sh`** — Lists everything under a pushr folder
  via `mc`, then uploads in parallel: small files (segments, m3u8, vtt,
  webp) go through Cloudflare's Bearer-auth PUT API; `.mkv` files route
  through the Worker `/__migrate` endpoint (Bearer PUT caps at 300 MiB
  so MKVs wouldn't fit). `PARALLEL=4` keeps under Cloudflare's
  1200-req/5min token quota; 429s back off exponentially.

- **`bulk-migrate.sh`** — Wrapper that reads an episode-list file
  (one folder name per line) and runs the per-episode script for each.
  Marks success via `.done` stamps in `/var/lib/r2-migration/` so a
  rerun resumes where it left off.

- **`repoint-episodes-to-r2.sql`** — After a batch finishes, this SQL
  backs up the old `episodes` row values into `_migration_backup_episodes`
  and rewrites every CDN-pointing field (`stream_links`,
  `download_links`, `subtitle_links`, `thumbnail_path`, `poster_url`,
  `thumbnail_url`, `gallery_urls`) to `https://cdn.hentaiclick.tv/...`.
  Idempotent.

- **`meili-reindex.sql`** — Builds full Meilisearch documents from
  Postgres in the exact shape `episodeToSearchDocument()` produces
  (`src/lib/meilisearch/sync.ts`). Streamable via `COPY ... TO STDOUT`,
  then POST the resulting NDJSON to Meili's
  `/indexes/episodes/documents` (after wrapping into a JSON array).
  Useful any time the DB and Meili drift and a full resync is needed.

## Required env

```sh
AKEY            pushr.io S3 access key (source)
SKEY            pushr.io S3 secret      (source)
CF_TOKEN        Cloudflare API token w/ R2 Edit (Bearer PUT to R2)
ACCOUNT_ID      Cloudflare account ID
MIGRATE_TOKEN   Secret bearer for the Worker /__migrate endpoint
```

## Typical run

```sh
# Generate the list of folders still on pushr
docker exec supabase-db psql -U postgres -d postgres -tAc "
SELECT DISTINCT split_part(stream_links->>'master', '/', 1)
FROM episodes
WHERE stream_links->>'master' NOT LIKE 'https://%'
ORDER BY 1
" > /tmp/episodes-to-migrate.txt

# Migrate everything
bash bulk-migrate.sh /tmp/episodes-to-migrate.txt

# Rewrite DB rows
slugs=$(docker exec supabase-db psql -U postgres -d postgres -tAc "
SELECT slug FROM episodes
WHERE stream_links->>'master' NOT LIKE 'https://%'
")
slug_array="{$(echo "$slugs" | tr '\n' ',' | sed 's/,$//')}"
docker exec -i supabase-db psql -U postgres -d postgres \
  -v "slug_list=$slug_array" < repoint-episodes-to-r2.sql

# Resync Meilisearch
docker exec -i supabase-db psql -U postgres -d postgres < meili-reindex.sql \
  | python3 -c 'import json,sys; docs=[json.loads(l) for l in sys.stdin]; \
                print(json.dumps(docs))' > /tmp/meili-docs.json
curl -X POST 'http://127.0.0.1:7700/indexes/episodes/documents' \
  -H "Authorization: Bearer $MEILISEARCH_ADMIN_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @/tmp/meili-docs.json
```

The full-state contract: after the rewrite, `episodes` rows only
contain `https://cdn.hentaiclick.tv/...` URLs (the relative-path form
from the original schema is gone, replaced with full URLs that go
straight through `resolveUrl()` in `src/lib/cdn.ts`).

## Rollback

```sql
UPDATE episodes e SET
  stream_links   = b.stream_links,
  download_links = b.download_links,
  subtitle_links = b.subtitle_links,
  thumbnail_path = b.thumbnail_path,
  poster_url     = b.poster_url,
  thumbnail_url  = b.thumbnail_url,
  gallery_urls   = b.gallery_urls
FROM _migration_backup_episodes b
WHERE e.slug = b.slug;
```
