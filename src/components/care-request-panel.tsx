"use client";

import { useState } from "react";

import { CareRequestDialog } from "@/components/care-request-dialog";
import { Lock, Message, ShieldCheck } from "@/components/icons";

type ServiceOption = { id: string; name: string };

type Props = {
  providerId: string;
  providerName: string;
  cityId: string;
  cityName: string;
  services: ServiceOption[];
  areas: string[];
  languages: string[];
  facts: { label: string; value: string }[];
  verified: boolean;
};

/**
 * The conversion engine. Sticks to the viewport on desktop so the one action
 * worth taking is never scrolled off; on mobile it sits inline after the
 * profile content, where a fixed bar would eat the small amount of reading
 * space these pages have.
 *
 * The privacy line above the button is doing real work — this is the moment a
 * family decides whether handing over a phone number is safe, and it is the
 * whole reason the product exists.
 */
export function CareRequestPanel({ facts, verified, ...enquiry }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <aside id="enquire" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
      <div className="card p-5">
        <h2 className="text-lg">Connect with this provider</h2>

        <p className="mt-2 flex items-start gap-2.5 text-sm text-ink-soft">
          <Lock className="mt-0.5 size-4 shrink-0 text-brand-500" />
          <span>
            Your contact details stay private until you send this request — and then
            only {enquiry.providerName} sees them.
          </span>
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-primary mt-5 w-full"
        >
          <Message className="size-4" />
          Submit care request
        </button>

        <p className="mt-3 text-center text-xs text-ink-faint">
          Free, and no obligation to book.
        </p>

        {verified && (
          <p className="mt-4 flex items-center gap-2 border-t border-line-soft pt-4 text-sm text-success-700">
            <ShieldCheck className="size-4 shrink-0" />
            Verified by CareConnect
          </p>
        )}

        {facts.length > 0 && (
          <dl className="mt-4 space-y-3 border-t border-line-soft pt-4 text-sm">
            {facts.map((fact) => (
              <div key={fact.label} className="flex gap-3">
                <dt className="w-24 shrink-0 text-ink-faint">{fact.label}</dt>
                <dd className="min-w-0">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <CareRequestDialog {...enquiry} open={open} onClose={() => setOpen(false)} />
    </aside>
  );
}
