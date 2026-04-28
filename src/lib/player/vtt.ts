/**
 * VTT parsing utilities for the video player.
 * Handles thumbnail preview cues and HLS subtitle segment concatenation.
 */

export interface ThumbCue {
  start: number;
  end: number;
  url: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** True if this cue references a sprite-sheet cell (had #xywh= in the VTT). */
  isSprite: boolean;
}

/**
 * Parse a VTT time string (HH:MM:SS.mmm or MM:SS.mmm) to seconds.
 */
function parseVttTime(str: string): number {
  const parts = str.split(":");
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return Number(h) * 3600 + Number(m) * 60 + parseFloat(s);
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return Number(m) * 60 + parseFloat(s);
  }
  return parseFloat(str);
}

/**
 * Parse a WebVTT thumbnail file (with optional #xywh sprite sheet coordinates)
 * into an array of ThumbCue objects for seek preview rendering.
 */
export function parseVttThumbs(vttText: string, baseUrl: string): ThumbCue[] {
  const cues: ThumbCue[] = [];
  // Normalize CRLF → LF before splitting
  const normalized = vttText.replace(/\r\n/g, "\n");
  const blocks = normalized.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const timeLine = lines.find((l) => l.includes("-->"));
    const urlLine = lines.find(
      (l) =>
        (l.includes(".jpg") || l.includes(".png") || l.includes(".webp")) &&
        !l.includes("-->")
    );
    if (!timeLine || !urlLine) continue;

    const [startStr, endStr] = timeLine.split("-->").map((s) => s.trim());
    const start = parseVttTime(startStr);
    const end = parseVttTime(endStr);

    // Skip invalid cues (end <= start)
    if (end <= start) continue;

    const hashIdx = urlLine.indexOf("#xywh=");
    let url: string;
    let x = 0,
      y = 0,
      w = 160,
      h = 90;
    let isSprite = false;
    if (hashIdx !== -1) {
      const path = urlLine.substring(0, hashIdx).trim();
      url = path.startsWith("http") ? path : `${baseUrl}/${path}`;
      const coords = urlLine.substring(hashIdx + 6).split(",").map(Number);
      [x, y, w, h] = coords;
      isSprite = true;
    } else {
      const path = urlLine.trim();
      url = path.startsWith("http") ? path : `${baseUrl}/${path}`;
    }

    cues.push({ start, end, url, x, y, w, h, isSprite });
  }
  return cues;
}

/**
 * Parse an HLS m3u8 subtitle playlist and fetch all VTT segments, returning
 * a concatenated VTT blob URL that can be used as a <track> src.
 * Returns null on fetch failure or empty playlist.
 */
export async function loadSubtitleVtt(
  subtitleM3u8Url: string
): Promise<string | null> {
  try {
    const res = await fetch(subtitleM3u8Url);
    if (!res.ok) return null;
    const text = await res.text();

    // Parse segment filenames from the m3u8
    const segmentNames = text
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"));

    if (segmentNames.length === 0) return null;

    const baseUrl = subtitleM3u8Url.substring(
      0,
      subtitleM3u8Url.lastIndexOf("/")
    );

    // Fetch all VTT segments in parallel
    const segmentPromises = segmentNames.map((name) =>
      fetch(`${baseUrl}/${name.trim()}`).then((r) =>
        r.ok ? r.text() : ""
      )
    );
    const segments = await Promise.all(segmentPromises);

    // Concatenate: keep WEBVTT header from first segment, strip from rest
    let combined = "";
    for (let i = 0; i < segments.length; i++) {
      // Normalize CRLF → LF
      const seg = segments[i].replace(/\r\n/g, "\n").trim();
      if (!seg) continue;
      if (i === 0) {
        combined = seg;
      } else {
        // Remove WEBVTT header line and any NOTE/STYLE blocks from subsequent segments
        const lines = seg.split("\n");
        const startIdx = lines.findIndex(
          (l, idx) => idx > 0 && l.includes("-->")
        );
        if (startIdx > 0) {
          // Include the line before --> (the cue identifier, if any)
          const cueStart = lines[startIdx - 1]?.trim()
            ? startIdx - 1
            : startIdx;
          combined += "\n\n" + lines.slice(cueStart).join("\n");
        }
      }
    }

    const blob = new Blob([combined], { type: "text/vtt" });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
