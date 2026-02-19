import { MeiliSearch } from "meilisearch";

export function getMeilisearchClient() {
  return new MeiliSearch({
    host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST ?? "http://localhost:7700",
    apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY ?? "",
  });
}

export function getMeilisearchAdminClient() {
  return new MeiliSearch({
    host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST ?? "http://localhost:7700",
    apiKey: process.env.MEILISEARCH_ADMIN_KEY ?? "",
  });
}
