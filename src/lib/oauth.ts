/**
 * The social providers wired up in Supabase Auth.
 *
 * Lives outside `provider/actions.ts` because a `"use server"` module may only
 * export async functions — a plain const there fails the build.
 */
export const OAUTH_PROVIDERS = ["google"] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
