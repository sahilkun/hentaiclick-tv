import { NextResponse } from "next/server";
import { getMeilisearchClient } from "@/lib/meilisearch/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = parseInt(searchParams.get("limit") ?? "25");
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const sort = searchParams.get("sort") ?? "uploadDate:desc";
  const genres = searchParams.get("genres")?.split(",").filter(Boolean) ?? [];
  const studios = searchParams.get("studios")?.split(",").filter(Boolean) ?? [];
  const minRating = parseFloat(searchParams.get("min_rating") ?? "0");

  try {
    const client = getMeilisearchClient();
    const index = client.index("episodes");

    // Build filter array
    const filters: string[] = ['status = "published"'];
    if (genres.length > 0) {
      filters.push(
        genres.map((g) => `genreSlugs = "${g}"`).join(" OR ")
      );
    }
    if (studios.length > 0) {
      filters.push(
        studios.map((s) => `studioSlug = "${s}"`).join(" OR ")
      );
    }
    if (minRating > 0) {
      filters.push(`ratingAvg >= ${minRating}`);
    }

    const result = await index.search(q, {
      limit,
      offset,
      filter: filters.length > 0 ? filters : undefined,
      sort: sort ? [sort] : undefined,
    });

    return NextResponse.json({
      hits: result.hits,
      totalHits: result.estimatedTotalHits ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    // If Meilisearch is not available, return empty results
    return NextResponse.json({
      hits: [],
      totalHits: 0,
      limit,
      offset,
    });
  }
}
