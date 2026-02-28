"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthContext } from "@/hooks/use-auth";
import type { Profile } from "@/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setLoading(false);
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    const supabase = createClient();

    // Fetch profile using raw fetch to avoid Supabase client lock issues
    const fetchProfile = async (
      userId: string,
      accessToken: string
    ): Promise<Profile | null> => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${userId}`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.pgrst.object+json",
            },
          }
        );
        if (!res.ok) return null;
        return (await res.json()) as Profile;
      } catch {
        return null;
      }
    };

    const buildFallbackProfile = (session: { user: { id: string; email?: string | null; user_metadata?: Record<string, any>; created_at: string; updated_at?: string | null }; access_token: string }): Profile => ({
      id: session.user.id,
      username: session.user.email?.split("@")[0] ?? "user",
      display_name:
        session.user.user_metadata?.display_name ??
        session.user.email?.split("@")[0] ??
        "User",
      role: "user",
      avatar_url: session.user.user_metadata?.avatar_url ?? null,
      bio: "",
      is_premium: false,
      blacklisted_genres: [],
      created_at: session.user.created_at,
      updated_at: session.user.updated_at ?? session.user.created_at,
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION" && session?.user) {
        // Set minimal user immediately (no DB call) so loading resolves fast
        setUser(buildFallbackProfile(session));
        setLoading(false);
        // Upgrade to full profile in background (non-blocking)
        fetchProfile(session.user.id, session.access_token).then(
          (profile) => {
            if (profile) setUser(profile);
          }
        );
      } else if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session?.user
      ) {
        const profile = await fetchProfile(
          session.user.id,
          session.access_token
        );
        setUser(profile ?? buildFallbackProfile(session));
        setLoading(false);
      } else if (event === "INITIAL_SESSION" && !session) {
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }, []);

  const contextValue = useMemo(
    () => ({ user, loading, signOut }),
    [user, loading, signOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
