import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidRedirect } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token = searchParams.get("token_hash") || searchParams.get("token");
  const type = searchParams.get("type");
  const redirect = isValidRedirect(searchParams.get("redirect"));

  const supabase = await createClient();

  // Handle PKCE / token-based verification (email confirmation link)
  if (token && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as "signup" | "email" | "recovery" | "invite" | "email_change",
    });

    if (!error) {
      if (type === "signup" || type === "email") {
        return NextResponse.redirect(`${origin}/email-confirmed`);
      }
      return NextResponse.redirect(`${origin}${redirect || "/"}`);
    }

    return NextResponse.redirect(`${origin}/login?error=verification_failed`);
  }

  // Handle code exchange (OAuth, magic link)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Auth error — redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
