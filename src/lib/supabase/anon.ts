import { createServerClient } from "@supabase/ssr";

/**
 * Singleton Supabase client for read-only public queries.
 * Uses a no-op cookie handler so it's safe inside `unstable_cache` callbacks
 * (which cannot access `cookies()` from next/headers).
 */
let client: ReturnType<typeof createServerClient> | null = null;

export function getAnonClient() {
  if (!client) {
    client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );
  }
  return client;
}
