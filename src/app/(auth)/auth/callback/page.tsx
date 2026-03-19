"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const redirect = searchParams.get("redirect") || "/";

    if (code) {
      const supabase = createClient();
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error("Exchange error:", error.message);
          // Maybe already exchanged, check session
          supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
              router.push(redirect);
            } else {
              router.push("/login?error=auth_failed");
            }
          });
        } else {
          router.push(redirect);
          router.refresh();
        }
      });
    } else {
      router.push("/login?error=auth_failed");
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}
