"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Check, Close, Lock } from "@/components/icons";
import {
  LANGUAGES,
  MOBILITY_LABEL,
  MOBILITY_LEVELS,
  PRICING_BANDS,
  PRICING_BAND_LABEL,
  URGENCY_LABEL,
  URGENCY_LEVELS,
} from "@/lib/domain";

type ServiceOption = { id: string; name: string };

type Props = {
  providerId: string;
  providerName: string;
  cityId: string;
  cityName: string;
  services: ServiceOption[];
  areas: string[];
  languages: string[];
  open: boolean;
  onClose: () => void;
};

/**
 * The care request, split across three steps.
 *
 * Ordering matters more than it looks. The flat version of this form asked for
 * a phone number in the first fieldset, which is the single most abandoned
 * field on the site — people had given nothing yet, so there was nothing to
 * lose by closing the tab. Contact details now come last, after the family has
 * already described the situation and has some sunk effort to protect.
 *
 * Every step stays mounted and is hidden with the `hidden` attribute rather
 * than unmounted. One <form>, one FormData, no per-step state to reconcile,
 * and a browser-restored session still has every answer in it. Hidden
 * fieldsets are skipped by assistive tech, so this costs nothing in a11y.
 */

const STEPS = [
  { title: "Care details", blurb: "What kind of help is needed, and for whom." },
  { title: "Logistics", blurb: "Where, when, and any preferences." },
  { title: "Your details", blurb: "How this provider gets back to you." },
] as const;

/** Which step owns which field, so a server-side error can jump the user back
 *  to the step that actually contains the offending input. */
const FIELD_STEP: Record<string, number> = {
  serviceId: 0,
  careRequirement: 0,
  recipientAge: 0,
  recipientGender: 0,
  mobility: 0,
  urgency: 0,
  area: 1,
  startDate: 1,
  hoursRequired: 1,
  duration: 1,
  preferredLanguage: 1,
  preferredCaregiverSex: 1,
  budgetBand: 1,
  familyName: 2,
  phone: 2,
  email: 2,
};

const PHONE_RE = /^(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {required ? (
          <span className="text-danger-500"> *</span>
        ) : (
          <span className="ms-1 text-xs font-normal text-ink-faint">optional</span>
        )}
      </span>
      {children}
      {hint && !error && <span className="field-hint block">{hint}</span>}
      {error && (
        <span className="field-error block" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function CareRequestDialog({
  providerId,
  providerName,
  cityId,
  cityName,
  services,
  areas,
  languages,
  open,
  onClose,
}: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingId = useId();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const languageOptions = languages.length > 0 ? languages : [...LANGUAGES];
  const isLast = step === STEPS.length - 1;

  /* Native <dialog> rather than a Radix/portal stack: it gives us the focus
     trap, Esc-to-close, inert background and top-layer stacking for free, and
     those are exactly the four things hand-rolled modals get wrong. */
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  /* Esc and backdrop dismissal fire on the element, not through our button, so
     the parent's state has to be told separately. */
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const handleClose = () => onClose();
    node.addEventListener("close", handleClose);
    return () => node.removeEventListener("close", handleClose);
  }, [onClose]);

  /** Validates only the fields on the current step. Reaching step 3 and then
   *  being bounced back to step 1 is the worst outcome this flow can produce,
   *  so each step is gated on the way forward. */
  function validateStep(index: number) {
    const form = formRef.current;
    if (!form) return true;
    const data = new FormData(form);
    const next: Record<string, string> = {};

    const read = (name: string) => String(data.get(name) ?? "").trim();

    if (index === 0) {
      if (!read("serviceId")) next.serviceId = "Choose the service you need";
      const requirement = read("careRequirement");
      if (requirement.length < 20) {
        next.careRequirement =
          "Tell the provider a little about what is needed — at least a sentence";
      }
    }

    if (index === 2) {
      if (read("familyName").length < 2) next.familyName = "Enter your name";
      const phone = read("phone");
      if (!phone) next.phone = "Enter a phone number we can reach you on";
      else if (!PHONE_RE.test(phone)) next.phone = "Enter a valid Indian mobile number";
      const email = read("email");
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        next.email = "Enter a valid email";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setFormError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setErrors({});
    setFormError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLast) {
      goNext();
      return;
    }
    if (!validateStep(2)) return;

    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(
      [...formData.entries()].filter(([, value]) => value !== ""),
    );

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, providerId, cityId }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
          /* Land the user on the earliest step that actually has a problem,
             otherwise the error message is on a screen they cannot see. */
          const steps = Object.keys(result.fieldErrors)
            .map((field) => FIELD_STEP[field])
            .filter((value): value is number => value !== undefined);
          if (steps.length > 0) setStep(Math.min(...steps));
        }
        setFormError(result.error ?? "We couldn't send your request. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push(`/enquiry/sent?provider=${encodeURIComponent(providerName)}`);
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      className="w-[min(42rem,calc(100vw-1.5rem))] rounded-panel bg-surface p-0 text-ink shadow-float backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] open:animate-fade-rise"
    >
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex max-h-[85vh] flex-col">
        {/* honeypot — hidden from people, tempting to bots */}
        <div aria-hidden="true" className="absolute left-[-9999px]">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {/* ------------------------------------------------------- header */}
        <div className="flex items-start gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={headingId} className="text-xl">
              Request care from {providerName}
            </h2>
            <p className="mt-1 text-sm text-ink-faint">
              Step {step + 1} of {STEPS.length} &middot; {STEPS[step].blurb}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost -me-2 -mt-1 p-2"
            aria-label="Close care request"
          >
            <Close className="size-5" />
          </button>
        </div>

        {/* ----------------------------------------------------- progress */}
        <ol className="flex gap-2 border-b border-line-soft px-5 py-3 sm:px-6">
          {STEPS.map((entry, index) => {
            const done = index < step;
            const current = index === step;
            return (
              <li key={entry.title} className="flex flex-1 items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? "bg-brand-600 text-white"
                      : current
                        ? "bg-brand-100 text-brand-700 ring-2 ring-brand-300"
                        : "bg-surface-sunk text-ink-faint"
                  }`}
                >
                  {done ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span
                  className={`hidden truncate text-xs sm:block ${
                    current ? "font-medium text-ink" : "text-ink-faint"
                  }`}
                >
                  {entry.title}
                </span>
                <span className="sr-only">
                  {entry.title}
                  {current ? " (current step)" : done ? " (completed)" : ""}
                </span>
              </li>
            );
          })}
        </ol>

        {/* --------------------------------------------------------- body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {/* ------------------------------------ step 1 — care details */}
          <fieldset hidden={step !== 0} className="space-y-4">
            <legend className="sr-only">Care details</legend>

            <Field label="Service needed" required error={errors.serviceId}>
              <select name="serviceId" className="field" defaultValue="">
                <option value="" disabled>
                  Choose a service
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Describe what's needed"
              required
              hint="A sentence or two is enough. No medical records, please."
              error={errors.careRequirement}
            >
              <textarea
                name="careRequirement"
                rows={4}
                className="field"
                placeholder="My mother is 74 and lives alone in Vizag. She needs help with cooking, bathing and medication reminders during the day."
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Their age" hint="Recommended" error={errors.recipientAge}>
                <input name="recipientAge" type="number" min={0} max={120} className="field" />
              </Field>

              <Field label="Their gender" error={errors.recipientGender}>
                <select name="recipientGender" className="field" defaultValue="">
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="How well do they move around?"
                hint="Recommended"
                error={errors.mobility}
              >
                <select name="mobility" className="field" defaultValue="">
                  <option value="">Not sure</option>
                  {MOBILITY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {MOBILITY_LABEL[level]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="How soon do you need this?" hint="Recommended" error={errors.urgency}>
                <select name="urgency" className="field" defaultValue="">
                  <option value="">Not sure</option>
                  {URGENCY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {URGENCY_LABEL[level]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </fieldset>

          {/* -------------------------------------- step 2 — logistics */}
          <fieldset hidden={step !== 1} className="space-y-4">
            <legend className="sr-only">Logistics</legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" error={undefined}>
                <input
                  className="field bg-surface-alt text-ink-soft"
                  value={cityName}
                  readOnly
                  aria-describedby={`${headingId}-city`}
                />
                <span id={`${headingId}-city`} className="field-hint block">
                  Set by the provider you are contacting.
                </span>
              </Field>

              <Field label="Area or locality" hint={`In ${cityName}`} error={errors.area}>
                {areas.length > 0 ? (
                  <select name="area" className="field" defaultValue="">
                    <option value="">Not sure yet</option>
                    {areas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input name="area" className="field" />
                )}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Start date" hint="Recommended" error={errors.startDate}>
                <input name="startDate" type="date" className="field" />
              </Field>

              <Field label="Hours needed" hint="Recommended" error={errors.hoursRequired}>
                <input name="hoursRequired" className="field" placeholder="e.g. 12 hours daily" />
              </Field>

              <Field label="How long for?" error={errors.duration}>
                <input name="duration" className="field" placeholder="e.g. 3 months" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Preferred language" error={errors.preferredLanguage}>
                <select name="preferredLanguage" className="field" defaultValue="">
                  <option value="">No preference</option>
                  {languageOptions.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Caregiver gender" error={errors.preferredCaregiverSex}>
                <select name="preferredCaregiverSex" className="field" defaultValue="">
                  <option value="">No preference</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </Field>

              <Field label="Budget" error={errors.budgetBand}>
                <select name="budgetBand" className="field" defaultValue="">
                  <option value="">Not sure yet</option>
                  {PRICING_BANDS.map((band) => (
                    <option key={band} value={band}>
                      {PRICING_BAND_LABEL[band]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Anything else?" error={errors.additionalMessage}>
              <textarea name="additionalMessage" rows={3} className="field" />
            </Field>
          </fieldset>

          {/* ---------------------------------------- step 3 — contact */}
          <fieldset hidden={step !== 2} className="space-y-4">
            <legend className="sr-only">Your details</legend>

            <p className="flex items-start gap-3 rounded-card bg-brand-50 px-4 py-3 text-sm text-brand-700">
              <Lock className="mt-0.5 size-4 shrink-0" />
              <span>
                These details go to {providerName} and nobody else. We never sell them,
                and no other provider on CareConnect can see this request.
              </span>
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name" required error={errors.familyName}>
                <input name="familyName" className="field" autoComplete="name" />
              </Field>

              <Field
                label="Phone number"
                required
                hint="Indian mobile number the provider can call."
                error={errors.phone}
              >
                <input name="phone" type="tel" className="field" autoComplete="tel" />
              </Field>
            </div>

            <Field
              label="Email"
              hint="We'll send you a copy of this request."
              error={errors.email}
            >
              <input name="email" type="email" className="field" autoComplete="email" />
            </Field>
          </fieldset>

          {formError && (
            <p
              role="alert"
              className="mt-5 rounded-card border border-danger-200 bg-danger-100 px-4 py-3 text-sm text-danger-700"
            >
              {formError}
            </p>
          )}
        </div>

        {/* ------------------------------------------------------- footer */}
        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-alt px-5 py-4 sm:px-6">
          {step > 0 ? (
            <button type="button" onClick={goBack} className="btn btn-secondary">
              Back
            </button>
          ) : (
            <span className="text-xs text-ink-faint">Takes about two minutes.</span>
          )}

          {isLast ? (
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? "Sending…" : `Send to ${providerName}`}
            </button>
          ) : (
            <button type="button" onClick={goNext} className="btn btn-primary">
              Continue
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
