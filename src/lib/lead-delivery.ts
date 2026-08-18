/**
 * Lead delivery, isolated behind a service layer (brief §15).
 *
 * The MVP ships with the `log` adapter: the lead still reaches the provider —
 * it lands in their dashboard inbox as an `in_app` delivery — while email and
 * WhatsApp attempts are recorded as `skipped` because no transport is wired up
 * yet. Nothing outside this file knows which transport is in use, so adding
 * Resend or a WhatsApp Business API provider means implementing one adapter and
 * changing LEAD_DELIVERY_ADAPTER.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import type { Tier } from "@/lib/domain";

export type DeliveryChannel = "email" | "whatsapp" | "in_app";
export type DeliveryStatus = "pending" | "sent" | "failed" | "skipped";

export type LeadPayload = {
  enquiryId: string;
  providerId: string;
  providerName: string;
  providerEmail: string;
  providerPhone: string;
  providerTier: Tier;
  familyName: string;
  familyPhone: string;
  cityName: string;
  serviceName: string;
  careRequirement: string;
};

export type DeliveryAttempt = {
  channel: DeliveryChannel;
  status: DeliveryStatus;
  detail: string;
};

interface LeadTransport {
  readonly name: string;
  send(channel: "email" | "whatsapp", lead: LeadPayload): Promise<DeliveryAttempt>;
}

/** Records the attempt without contacting anything. Default for the MVP. */
const logTransport: LeadTransport = {
  name: "log",
  async send(channel, lead) {
    console.info(
      `[lead-delivery] would send ${channel} lead ${lead.enquiryId} to ${lead.providerName}`,
    );
    return {
      channel,
      status: "skipped",
      detail: `No ${channel} transport configured; lead is available in the provider dashboard.`,
    };
  },
};

function getTransport(): LeadTransport {
  switch (process.env.LEAD_DELIVERY_ADAPTER) {
    // case "email": return resendTransport;   // implement when a provider is chosen
    // case "whatsapp": return whatsappTransport;
    default:
      return logTransport;
  }
}

/**
 * Brief §12 — which channels a tier is entitled to.
 * Free providers get no push delivery, but the lead is still in their inbox.
 */
function channelsForTier(tier: Tier): Array<"email" | "whatsapp"> {
  if (tier === "premium") return ["email", "whatsapp"];
  if (tier === "standard") return ["email"];
  return [];
}

/**
 * Attempts every channel the provider's tier allows, records each attempt in
 * `lead_deliveries`, and never throws — a delivery failure must not lose the
 * enquiry that has already been stored.
 */
export async function deliverLead(
  supabase: SupabaseClient<Database>,
  lead: LeadPayload,
): Promise<DeliveryAttempt[]> {
  const transport = getTransport();

  const attempts: DeliveryAttempt[] = [
    {
      channel: "in_app",
      status: "sent",
      detail: "Lead available in the provider dashboard.",
    },
  ];

  for (const channel of channelsForTier(lead.providerTier)) {
    try {
      attempts.push(await transport.send(channel, lead));
    } catch (error) {
      attempts.push({
        channel,
        status: "failed",
        detail: error instanceof Error ? error.message : "Unknown delivery error",
      });
    }
  }

  const { error } = await supabase.from("lead_deliveries").insert(
    attempts.map((attempt) => ({
      enquiry_id: lead.enquiryId,
      provider_id: lead.providerId,
      channel: attempt.channel,
      status: attempt.status,
      detail: attempt.detail,
    })),
  );

  if (error) {
    console.error("[lead-delivery] failed to record delivery attempts", error);
  }

  return attempts;
}
