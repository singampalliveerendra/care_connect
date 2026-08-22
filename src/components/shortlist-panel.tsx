"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useId, useState } from "react";

import { Lock } from "@/components/icons";
import type { Service } from "@/lib/database.types";

type ShortlistProvider = { id: string; name: string };

const PHONE_RE = /^(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;

/** Radios beyond this many stop being scannable and become a list you read. */
const RADIO_LIMIT = 6;

/**
 * The sidebar request card.
 *
 * A family three minutes into their first search usually cannot tell these
 * listings apart yet, and asking them to pick one before they may ask a
 * question is the wrong order. This sends the same written request to the
 * providers currently at the top of their results — named, in the open, above
 * the button — so the shortcut never costs them the knowledge of who was
 * contacted on their behalf.
 */
export function ShortlistPanel({
  providers,
  cityName,
  services,
  defaultServiceId,
}: {
  providers: ShortlistProvider[];
  cityName: string;
  services: Pick<Service, "id" | "name">[];
  defaultServiceId?: string;
}) {
  const router = useRouter();
  const headingId = useId();
  const legendId = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (providers.length === 0) return null;

  /* Radios when the choice is small enough to see at once, a select when it
     isn't — same field name either way, so the submit handler never knows
     which one it got. */
  const asRadios = services.length <= RADIO_LIMIT;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const read = (name: string) => String(data.get(name) ?? "").trim();

    const next: Record<string, string> = {};
    if (!read("serviceId")) next.serviceId = "Choose the type of care you need";
    if (read("familyName").length < 2) next.familyName = "Enter your name";
    const phone = read("phone");
    if (!phone) next.phone = "Enter a mobile number they can call";
    else if (!PHONE_RE.test(phone)) next.phone = "Enter a valid Indian mobile number";
    if (read("careRequirement").length < 20) {
      next.careRequirement = "A sentence about what's needed helps them answer properly";
    }
    if (!data.get("agree")) next.agree = "Please accept the terms to continue";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/enquiries/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerIds: providers.map((provider) => provider.id),
          serviceId: read("serviceId"),
          familyName: read("familyName"),
          phone,
          careRequirement: read("careRequirement"),
          website: read("website"),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        setFormError(result.error ?? "We couldn't send your request. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push(`/enquiry/sent?count=${result.sent}`);
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  const fieldError = (name: string) =>
    errors[name] && (
      <span className="field-error block" role="alert">
        {errors[name]}
      </span>
    );

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-labelledby={headingId}
        className="card overflow-hidden"
      >
        <div className="border-b border-line bg-surface-alt px-5 py-4">
          <h2 id={headingId} className="text-lg font-semibold">
            Get {providers.length} providers to call you
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            One request, sent to the top {providers.length} matches
            {cityName ? ` in ${cityName}` : ""}. Free, no obligation.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          {/* honeypot — hidden from people, tempting to bots */}
          <div aria-hidden="true" className="absolute left-[-9999px]">
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          {asRadios ? (
            <fieldset>
              <legend id={legendId} className="field-label">
                What kind of care are you looking for?
              </legend>
              <div className="grid gap-2">
                {services.map((service) => (
                  <label key={service.id} className="choice">
                    <input
                      type="radio"
                      name="serviceId"
                      value={service.id}
                      defaultChecked={service.id === defaultServiceId}
                      className="accent-brand-600"
                    />
                    {service.name}
                  </label>
                ))}
              </div>
              {fieldError("serviceId")}
            </fieldset>
          ) : (
            <label className="block">
              <span className="field-label">What kind of care are you looking for?</span>
              <select
                name="serviceId"
                defaultValue={defaultServiceId ?? ""}
                className="field"
                aria-invalid={Boolean(errors.serviceId)}
              >
                <option value="" disabled>
                  Choose a service
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {fieldError("serviceId")}
            </label>
          )}

          <label className="block">
            <span className="field-label">Your name</span>
            <input
              name="familyName"
              className="field"
              autoComplete="name"
              placeholder="Name"
              aria-invalid={Boolean(errors.familyName)}
            />
            {fieldError("familyName")}
          </label>

          <label className="block">
            <span className="field-label">Mobile number</span>
            <input
              name="phone"
              type="tel"
              className="field"
              autoComplete="tel"
              placeholder="Mobile number"
              aria-invalid={Boolean(errors.phone)}
            />
            {fieldError("phone")}
          </label>

          <label className="block">
            <span className="field-label">What help is needed?</span>
            <textarea
              name="careRequirement"
              rows={3}
              className="field"
              placeholder="My father is 78, lives alone, and needs help with meals and medication during the day."
              aria-invalid={Boolean(errors.careRequirement)}
            />
            {fieldError("careRequirement")}
          </label>

          {/* Named, not counted. "Sent to 3 providers" is the line that makes
              people feel their number has been handed around. */}
          <div className="rounded-card border border-line-soft bg-surface-alt px-4 py-3 text-sm">
            <p className="font-medium text-ink">This request goes to</p>
            <ul className="mt-1 space-y-0.5 text-ink-soft">
              {providers.map((provider) => (
                <li key={provider.id}>{provider.name}</li>
              ))}
            </ul>
          </div>

          <div>
            <label className="flex items-start gap-2.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                name="agree"
                className="mt-0.5 size-4 shrink-0 accent-brand-600"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-brand-600 hover:underline">
                  terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-brand-600 hover:underline">
                  privacy policy
                </Link>
                .
              </span>
            </label>
            {fieldError("agree")}
          </div>

          {formError && (
            <p
              role="alert"
              className="rounded-card border border-danger-200 bg-danger-100 px-4 py-3 text-sm text-danger-700"
            >
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full py-3 text-base"
          >
            {submitting ? "Sending…" : "Send Enquiry"}
          </button>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-faint">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-success-500" />
            Only these providers see your number. We never sell it.
          </p>
        </div>
      </form>
    </aside>
  );
}
