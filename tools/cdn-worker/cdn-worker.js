// hentaiclick CDN Worker — fronts the `hentai-bucket` R2 bucket on
// cdn.hentaiclick.tv. Replaces pushr.io's serving behavior with:
//   - Referer hotlink protection (matches pushr's policy)
//   - Content-Disposition: attachment for .mkv (fixes downloads)
//   - Range request support for video seek + download resume
//   - Tier-appropriate Cache-Control:
//       * .m3u8        → 5 min  (playlists may update on re-encode)
//       * .vtt         → 1 hour (subtitle playlists + cue files)
//       * everything   → 1 year + immutable (segments, mkv, images)
//   - CORS so the HLS.js player can fetch segments cross-origin
//   - Admin migrate endpoint that streams pushr → R2 in one hop
//     (POST /__migrate with X-Migrate-Token). Used for large MKVs
//     that exceed the Bearer-API 300 MiB single-PUT cap — env.BUCKET
//     binding handles up to 5 GB per put().
//
// Routes: cdn.hentaiclick.tv/*  (configured via Worker Routes)
// Bindings:
//   env.BUCKET              → R2 bucket `hentai-bucket`
//   env.MIGRATE_TOKEN       → secret bearer required for /__migrate
//   env.SIGNED_URL_SECRET   → HMAC secret for signed-URL validation
//                             on .mkv downloads (matches the value
//                             the VPS uses to mint URLs)

const ALLOWED_REFERER_HOSTS = new Set([
  "hentaiclick.tv",
  "www.hentaiclick.tv",
  "localhost",
  "127.0.0.1",
]);

// Many video players + browser downloads strip Referer (the spec's
// `no-referrer-when-downgrade` default omits it for cross-origin media
// requests). Block empty-Referer would break legitimate playback, so
// we allow them. Pushr.io was identical.
const ALLOW_EMPTY_REFERER = true;

// Common CORS headers — applied to every response so the player and
// download flow can use fetch() cross-origin.
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, If-Modified-Since, If-None-Match",
    "Access-Control-Expose-Headers":
      "Content-Length, Content-Range, Content-Disposition, ETag, Accept-Ranges",
    "Access-Control-Max-Age": "86400",
  };
}

function isAllowedReferer(refererHeader) {
  if (!refererHeader) return ALLOW_EMPTY_REFERER;
  try {
    const host = new URL(refererHeader).hostname;
    return ALLOWED_REFERER_HOSTS.has(host);
  } catch {
    return false;
  }
}

// Build a download-friendly filename from the R2 key.
//   "Series Name - 01/1080p_full.mkv"  →  "Series Name - 01 - 1080p.mkv"
// Sanitized to ASCII-safe chars so it survives all browsers.
function deriveAttachmentFilename(key) {
  const parts = key.split("/");
  const last = parts[parts.length - 1] || "download.mkv";
  const folder = parts.length > 1 ? parts[parts.length - 2] : "";
  // Strip the "_full" infix; convert "1080p_full.mkv" → "1080p.mkv"
  const ext = last.toLowerCase().endsWith(".mkv") ? ".mkv" : "";
  const qMatch = last.match(/(\d{3,4}p)/);
  const quality = qMatch ? qMatch[1] : "";
  const base = folder
    ? quality
      ? `${folder} - ${quality}`
      : `${folder} - ${last.replace(/\.mkv$/i, "")}`
    : last.replace(/\.mkv$/i, "");
  // Strip non-ASCII-safe filename chars (keep letters/digits/dot/dash/space/underscore)
  const safe = `${base}${ext}`.replace(/[^\w. -]/g, "_");
  return safe || "download.mkv";
}

function cacheControlFor(key) {
  const lower = key.toLowerCase();
  if (lower.endsWith(".m3u8")) {
    // Playlists may be regenerated when an episode is re-encoded.
    return "public, max-age=300";
  }
  if (lower.endsWith(".vtt")) {
    // Subtitle cue / playlist files
    return "public, max-age=3600";
  }
  // Segments, mkv, webp, init.mp4, etc. — content-addressed once uploaded.
  return "public, max-age=31536000, immutable";
}

// ---------- Signed-URL validation ----------
//
// MKV downloads are gated by HMAC-signed URLs minted on the VPS by
// /api/download (after auth + quota check). The browser then fetches
// `cdn.hentaiclick.tv/<key>?exp=<ms>&sig=<hex>` directly — the Worker
// validates the signature here, so the VPS never proxies the file
// body. Eliminates ~500 MB – 2 GB of VPS egress per download.
//
// Signature: HMAC-SHA256(`${fullUrlWithoutQuery}|${exp}`, SIGNED_URL_SECRET).
// `fullUrlWithoutQuery` is `https://cdn.hentaiclick.tv/<encoded-key>`,
// exactly the URL the VPS sees when signing.
//
// Returns:
//   { ok: true }                       valid signature, not expired
//   { ok: false, status: 403, ... }    missing / malformed / mismatched
//   { ok: false, status: 410, ... }    expired

function hexToBytes(hex) {
  if (typeof hex !== "string" || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(hex.substr(i * 2, 2), 16);
    if (Number.isNaN(byte)) return null;
    out[i] = byte;
  }
  return out;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function validateSignedUrl(url, env) {
  const exp = url.searchParams.get("exp");
  const sig = url.searchParams.get("sig");
  if (!exp || !sig) {
    return { ok: false, status: 403, reason: "Missing signature" };
  }
  const expMs = parseInt(exp, 10);
  if (!Number.isFinite(expMs)) {
    return { ok: false, status: 403, reason: "Bad signature" };
  }
  if (Date.now() > expMs) {
    return { ok: false, status: 410, reason: "Signed URL expired" };
  }
  const secret = env.SIGNED_URL_SECRET;
  if (!secret) {
    // Mis-configured Worker — fail closed.
    return { ok: false, status: 500, reason: "Server not configured" };
  }

  // Sign `${urlWithoutQuery}|${exp}` to match the VPS minting convention.
  const urlWithoutQuery = `${url.origin}${url.pathname}`;
  const message = `${urlWithoutQuery}|${expMs}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(message)),
  );
  const provided = hexToBytes(sig);
  if (!provided || !timingSafeEqual(expected, provided)) {
    return { ok: false, status: 403, reason: "Bad signature" };
  }
  return { ok: true };
}

// Parse a single-range "bytes=START-END" / "bytes=START-" header into an
// R2 range option `{ offset, length }`. Returns null if the header is
// unparseable or multi-range (we don't handle multi-range; rare in
// practice for video). The caller should fall through to a full GET.
function parseSingleRange(rangeHeader) {
  if (!rangeHeader) return null;
  const m = rangeHeader.match(/^bytes=(\d+)-(\d*)$/);
  if (!m) return null;
  const offset = parseInt(m[1], 10);
  const end = m[2] ? parseInt(m[2], 10) : null;
  if (Number.isNaN(offset) || (end !== null && Number.isNaN(end))) return null;
  const length = end !== null ? end - offset + 1 : undefined;
  return { offset, length };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Always answer CORS preflight cheaply.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Admin migrate endpoint — streams pushr → R2 via R2 binding (no
    // 300 MiB single-PUT cap). Auth via shared secret; never serves GETs.
    if (url.pathname === "/__migrate") {
      return handleMigrate(request, env);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD, OPTIONS", ...corsHeaders() },
      });
    }

    const key = decodeURIComponent(url.pathname.slice(1)); // strip leading "/"
    if (!key) {
      return new Response("Not Found", { status: 404, headers: corsHeaders() });
    }

    // .mkv downloads bypass the Referer check and instead require a
    // VPS-minted signed URL (HMAC + 5-min expiry, validated below).
    // Bookmarks, copy-link-and-share, scrapers — none of them can
    // pull the file without a fresh signature. Streaming segments
    // (m3u8/m4s/init.mp4/vtt/webp/etc.) keep the Referer hotlink
    // check; they're not behind a quota and need to be playable by
    // the HLS.js player without per-request signing.
    const isMkv = key.toLowerCase().endsWith(".mkv");
    if (isMkv) {
      const v = await validateSignedUrl(url, env);
      if (!v.ok) {
        return new Response(v.reason, {
          status: v.status,
          headers: corsHeaders(),
        });
      }
    } else if (!isAllowedReferer(request.headers.get("Referer"))) {
      return new Response("Hotlinked content blocked", {
        status: 403,
        headers: corsHeaders(),
      });
    }

    const range = parseSingleRange(request.headers.get("Range"));

    // HEAD: fetch metadata only, no body
    if (request.method === "HEAD") {
      const head = await env.BUCKET.head(key);
      if (!head) {
        return new Response(null, { status: 404, headers: corsHeaders() });
      }
      const headers = buildResponseHeaders(head, key);
      headers.set("Content-Length", String(head.size));
      // HEAD must not return a body; use undefined body.
      return new Response(null, { status: 200, headers });
    }

    // GET (with optional range)
    const r2Opts = range ? { range } : undefined;
    const object = await env.BUCKET.get(key, r2Opts);
    if (!object) {
      return new Response("Not Found", { status: 404, headers: corsHeaders() });
    }

    const headers = buildResponseHeaders(object, key);

    // If we honored a range, return 206 + Content-Range.
    let status = 200;
    if (range && object.range) {
      const start = object.range.offset;
      const length = object.range.length ?? object.size - start;
      const end = start + length - 1;
      headers.set("Content-Range", `bytes ${start}-${end}/${object.size}`);
      headers.set("Content-Length", String(length));
      status = 206;
    } else {
      headers.set("Content-Length", String(object.size));
    }

    return new Response(object.body, { status, headers });
  },
};

// Admin migrate handler. Streams a source URL (typically pushr.io) into
// R2 under a chosen key. Auth: shared secret in `X-Migrate-Token` header.
// Body: JSON `{ "sourceUrl": "...", "destKey": "...",
//                "contentType": "video/x-matroska",
//                "referer": "https://hentaiclick.tv/" }`
//
// Why this exists: the public Cloudflare Bearer-auth R2 API caps single
// PUT at 300 MiB, and lacks a documented multipart endpoint on the
// /accounts/.../r2/buckets/.../objects/... path. The R2 binding inside
// a Worker supports streamed put() up to ~5 GB, so we use the Worker
// itself as the upload conduit. Bonus: avoids /tmp staging on the VPS
// for the largest files.
async function handleMigrate(request, env) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const provided = request.headers.get("X-Migrate-Token");
  if (!provided || !env.MIGRATE_TOKEN || provided !== env.MIGRATE_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  const { sourceUrl, destKey, contentType, referer } = body || {};
  if (!sourceUrl || !destKey) {
    return new Response("sourceUrl + destKey required", { status: 400 });
  }

  // Fetch from source. Worker fetch streams without buffering the body,
  // and R2.put() with a stream avoids loading the whole file into memory.
  const srcResp = await fetch(sourceUrl, {
    headers: referer ? { Referer: referer } : {},
    // cf.cacheTtl=0 so we don't fill CF cache with one-shot migration GETs
    cf: { cacheTtl: 0, cacheEverything: false },
  });
  if (!srcResp.ok) {
    return new Response(
      JSON.stringify({ ok: false, stage: "fetch", status: srcResp.status }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const ct = contentType || srcResp.headers.get("Content-Type") || "application/octet-stream";

  await env.BUCKET.put(destKey, srcResp.body, {
    httpMetadata: { contentType: ct },
  });

  // HEAD the object to confirm size landed.
  const head = await env.BUCKET.head(destKey);
  return new Response(
    JSON.stringify({
      ok: true,
      key: destKey,
      size: head ? head.size : null,
      contentType: ct,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

// Build the standard response headers for an R2 object (HEAD or GET).
// `objectOrHead` can be an R2Object (from .get) or an R2ObjectHead
// (from .head) — both implement writeHttpMetadata and have httpEtag.
function buildResponseHeaders(objectOrHead, key) {
  const headers = new Headers();
  objectOrHead.writeHttpMetadata(headers); // Content-Type from R2 metadata
  headers.set("ETag", objectOrHead.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", cacheControlFor(key));

  // CORS — repeated here so all responses (200/206/404/403) carry them.
  const cors = corsHeaders();
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);

  // Force-download MKVs (the whole point of moving off pushr).
  if (key.toLowerCase().endsWith(".mkv")) {
    headers.set(
      "Content-Disposition",
      `attachment; filename="${deriveAttachmentFilename(key)}"`
    );
    headers.set("Content-Type", "application/octet-stream");
  }

  return headers;
}
