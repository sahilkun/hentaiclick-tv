import { MeiliSearch } from "meilisearch";

let searchClient: MeiliSearch | null = null;
let adminClient: MeiliSearch | null = null;

export function getMeilisearchClient(): MeiliSearch {
  if (!searchClient) {
    searchClient = new MeiliSearch({
      host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST ?? "http://localhost:7700",
      apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY ?? "",
      timeout: 5000,
    });
  }
  return searchClient;
}

export function getMeilisearchAdminClient(): MeiliSearch {
  if (!adminClient) {
    adminClient = new MeiliSearch({
      host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST ?? "http://localhost:7700",
      apiKey: process.env.MEILISEARCH_ADMIN_KEY ?? "",
      timeout: 5000,
    });
  }
  return adminClient;
}
