import { NextResponse, type NextRequest } from "next/server";

import { requestOrigin } from "@/lib/site-url";
import { ensureProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

/**
 * Where Google drops the user after consent.
 *
 * Supabase gives us a one-time `code`; exchanging it here (rather than in the
 * browser) is what writes the session cookies server-side, so the very next
 * request already sees a signed-in user. Nothing else on the site should link
 * to this route.
 */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request.headers);
  const code = request.nextUrl.searchParams.get("code");
  const rawNext = request.nextUrl.searchParams.get("next") ?? "";
  const next = rawNext.startsWith("/provider") ? rawNext : "/provider/dashboard";

  // The provider reports a refusal by sending the user back with an error
  // instead of a code — a cancelled consent screen is the common case, and it
  // should read as "nothing happened", not as a failure.
  if (!code) {
    const denied = request.nextUrl.searchParams.get("error");
    return NextResponse.redirect(
      `${origin}/provider/login?error=${denied === "access_denied" ? "cancelled" : "oauth"}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/provider/login?error=oauth`);
  }

  // A social sign-in skips the signup form, so the profile row that
  // `signUp` would have written has to be created here instead.
  await ensureProfile(supabase, data.user.id);

  const { data: listing } = await supabase
    .from("providers")
    .select("id")
    .eq("owner_id", data.user.id)
    .maybeSingle();

  // First time through there is nothing to manage yet — send them to the form
  // rather than to an empty dashboard.
  return NextResponse.redirect(`${origin}${listing ? next : "/provider/register"}`);
}
