import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Creates the profile row if it is missing, and never touches an existing one.
 *
 * The role column is not writable by users (see the role lockdown migration):
 * a new row takes the 'provider' default, and an admin stays an admin however
 * they sign in.
 */
export async function ensureProfile(supabase: ServerClient, userId: string) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });
  if (error) console.error("ensureProfile failed", userId, error);
}

/** True when the signed-in user's profile says admin. */
export async function isAdmin(supabase: ServerClient, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}
