import { NextResponse } from "next/server";
import { getMeilisearchClient } from "@/lib/meilisearch/client";
import { escapeMeiliFilter } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_LIMIT = 100;
const MAX_OFFSET = 10000;
const MAX_QUERY_LENGTH = 500;

const ALLOWED_SORTS = new Set([
  "uploadDate:desc",
  "uploadDate:asc",
  "releaseDate:desc",
  "releaseDate:asc",
  "viewCount:desc",
  "ratingAvg:desc",
  "likeCount:desc",
  "views7d:desc",
  "title:asc",
  "title:desc",
]);

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`search:${ip}`, 60, 60_000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").slice(0, MAX_QUERY_LENGTH);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "25") || 25, 1),
    MAX_LIMIT
  );
  const offset = Math.min(
    Math.max(parseInt(searchParams.get("offset") ?? "0") || 0, 0),
    MAX_OFFSET
  );
  const sortParam = searchParams.get("sort") ?? "uploadDate:desc";
  const sort = ALLOWED_SORTS.has(sortParam) ? sortParam : "uploadDate:desc";
  const genres =
    searchParams.get("genres")?.split(",").filter(Boolean) ?? [];
  const blacklist =
    searchParams.get("blacklist")?.split(",").filter(Boolean) ?? [];
  const studios =
    searchParams.get("studios")?.split(",").filter(Boolean) ?? [];
  const minRating = parseFloat(searchParams.get("min_rating") ?? "0");
  const yearRaw = parseInt(searchParams.get("year") ?? "");
  const year =
    !isNaN(yearRaw) && yearRaw >= 1900 && yearRaw <= 2100 ? yearRaw : null;

  try {
    const client = getMeilisearchClient();
    const index = client.index("episodes");

    // Build filter array
    const filters: string[] = ['status = "published"'];
    if (genres.length > 0) {
      filters.push(
        genres
          .map((g) => `genreSlugs = "${escapeMeiliFilter(g)}"`)
          .join(" OR ")
      );
    }
    if (blacklist.length > 0) {
      for (const slug of blacklist) {
        filters.push(`genreSlugs != "${escapeMeiliFilter(slug)}"`);
      }
    }
    if (studios.length > 0) {
      filters.push(
        studios
          .map((s) => `studioSlug = "${escapeMeiliFilter(s)}"`)
          .join(" OR ")
      );
    }
    if (Number.isFinite(minRating) && minRating > 0 && minRating <= 10) {
      filters.push(`ratingAvg >= ${minRating}`);
    }
    if (year) {
      filters.push(`year = ${year}`);
    }

    const result = await index.search(q, {
      limit,
      offset,
      filter: filters.length > 0 ? filters : undefined,
      sort: sort ? [sort] : undefined,
    });

    return NextResponse.json(
      {
        hits: result.hits,
        totalHits: result.estimatedTotalHits ?? 0,
        limit,
        offset,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json({
      hits: [],
      totalHits: 0,
      limit,
      offset,
    });
  }
}
