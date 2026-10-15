"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isAdmin } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = { error?: string; done?: string };

const DECISION_DONE: Record<string, string> = {
  approved: "Approved — the listing is now live in search.",
  rejected: "Rejected — the listing stays hidden.",
  suspended: "Suspended — the listing is hidden from search.",
  pending: "Moved back to pending review.",
};

const reviewSchema = z.object({
  providerId: z.uuid("Unknown listing"),
  decision: z.enum(["approved", "rejected", "suspended", "pending"], "Unknown decision"),
  notes: z
    .string()
    .trim()
    .max(1000, "Keep notes under 1000 characters")
    .optional()
    .transform((v) => v || undefined),
});

/**
 * Approves, rejects, suspends or re-opens a listing.
 *
 * The admin check here is for a clear message; the real gate is the database
 * function, which re-checks is_admin() and is the only path that can change a
 * listing's status for a signed-in user.
 */
export async function reviewProvider(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has ended. Sign in again." };
  if (!(await isAdmin(supabase, user.id))) return { error: "Only admins can review listings." };

  const parsed = reviewSchema.safeParse({
    providerId: formData.get("providerId"),
    decision: formData.get("decision"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };

  const { providerId, decision, notes } = parsed.data;
  const { error } = await supabase.rpc("admin_review_provider", {
    p_provider_id: providerId,
    p_decision: decision,
    p_notes: notes ?? null,
  });

  if (error) {
    if (error.code === "P0002") return { error: "That listing no longer exists." };
    if (error.code === "42501") return { error: "Only admins can review listings." };
    console.error("reviewProvider failed", providerId, decision, error);
    return { error: "We couldn't save that decision. Please try again." };
  }

  // Search, the homepage and the listing's own page are all cached.
  revalidatePath("/", "layout");
  return { done: DECISION_DONE[decision] };
}
