import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton admin (service-role) Supabase client.
 * Reuses the same instance across calls to avoid creating a new client
 * on every view/rating/favorite/comment sync.
 */
let adminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
      );
    }

    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}

/** @deprecated Use `getAdminClient()` instead */
export const createAdminClient = getAdminClient;
