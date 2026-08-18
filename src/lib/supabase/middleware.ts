import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the auth session on every request and gates the provider portal.
 * Without this the session cookie expires and Server Components see a signed-out user.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Note the trailing slash: `/providers/...` are public profile pages and must
  // never be caught by the provider-portal gate.
  const inPortal = pathname === "/provider" || pathname.startsWith("/provider/");
  const isProtected =
    inPortal &&
    !pathname.startsWith("/provider/login") &&
    !pathname.startsWith("/provider/register");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/provider/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
