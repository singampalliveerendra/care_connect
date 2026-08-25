"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
};

const fieldClass =
  "w-full rounded-card border border-line bg-surface px-3 py-2.5 text-ink placeholder:text-ink-faint";

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
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-danger-500"> *</span>}
        {!required && <span className="ms-1 text-xs font-normal text-ink-faint">optional</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger-500">{error}</span>}
    </label>
  );
}

export function EnquiryForm({
  providerId,
  providerName,
  cityId,
  cityName,
  services,
  areas,
  languages,
}: Props) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const languageOptions = languages.length > 0 ? languages : [...LANGUAGES];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        if (result.fieldErrors) setErrors(result.fieldErrors);
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
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* honeypot — hidden from people, tempting to bots */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="space-y-4 rounded-card border border-line bg-surface p-5">
        <legend className="px-1 text-sm font-semibold">How we reach you</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" required error={errors.familyName}>
            <input name="familyName" className={fieldClass} autoComplete="name" required />
          </Field>

          <Field
            label="Phone number"
            required
            hint="A mobile number the provider can call."
            error={errors.phone}
          >
            <input name="phone" type="tel" className={fieldClass} autoComplete="tel" required />
          </Field>
        </div>

        <Field label="Email" hint="We'll send you a copy of this request." error={errors.email}>
          <input name="email" type="email" className={fieldClass} autoComplete="email" />
        </Field>
      </fieldset>

      <fieldset className="space-y-4 rounded-card border border-line bg-surface p-5">
        <legend className="px-1 text-sm font-semibold">Who needs care</legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Their age" hint="Recommended" error={errors.recipientAge}>
            <input name="recipientAge" type="number" min={0} max={120} className={fieldClass} />
          </Field>

          <Field label="Their gender" error={errors.recipientGender}>
            <select name="recipientGender" className={fieldClass} defaultValue="">
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <Field label="Area or locality" hint={`In ${cityName}`} error={errors.area}>
            {areas.length > 0 ? (
              <select name="area" className={fieldClass} defaultValue="">
                <option value="">Not sure yet</option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            ) : (
              <input name="area" className={fieldClass} />
            )}
          </Field>
        </div>

        <Field label="How well do they move around?" hint="Recommended" error={errors.mobility}>
          <select name="mobility" className={fieldClass} defaultValue="">
            <option value="">Not sure</option>
            {MOBILITY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {MOBILITY_LABEL[level]}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset className="space-y-4 rounded-card border border-line bg-surface p-5">
        <legend className="px-1 text-sm font-semibold">What care is needed</legend>

        <Field label="Service needed" required error={errors.serviceId}>
          <select name="serviceId" className={fieldClass} defaultValue="" required>
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
            className={fieldClass}
            placeholder="My mother is 74 and lives alone in Vizag. She needs help with cooking, bathing and medication reminders during the day."
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Hours needed" hint="Recommended" error={errors.hoursRequired}>
            <input name="hoursRequired" className={fieldClass} placeholder="e.g. 12 hours daily" />
          </Field>

          <Field label="Start date" hint="Recommended" error={errors.startDate}>
            <input name="startDate" type="date" className={fieldClass} />
          </Field>

          <Field label="How long for?" error={errors.duration}>
            <input name="duration" className={fieldClass} placeholder="e.g. 3 months" />
          </Field>
        </div>

        <Field label="How soon do you need this?" hint="Recommended" error={errors.urgency}>
          <select name="urgency" className={fieldClass} defaultValue="">
            <option value="">Not sure</option>
            {URGENCY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {URGENCY_LABEL[level]}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset className="space-y-4 rounded-card border border-line bg-surface p-5">
        <legend className="px-1 text-sm font-semibold">Preferences</legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Preferred language" error={errors.preferredLanguage}>
            <select name="preferredLanguage" className={fieldClass} defaultValue="">
              <option value="">No preference</option>
              {languageOptions.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Caregiver gender" error={errors.preferredCaregiverSex}>
            <select name="preferredCaregiverSex" className={fieldClass} defaultValue="">
              <option value="">No preference</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </Field>

          <Field label="Budget" error={errors.budgetBand}>
            <select name="budgetBand" className={fieldClass} defaultValue="">
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
          <textarea name="additionalMessage" rows={3} className={fieldClass} />
        </Field>
      </fieldset>

      {formError && (
        <p
          role="alert"
          className="rounded-card border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-card bg-brand-600 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Sending…" : `Send to ${providerName}`}
        </button>
        <p className="text-xs text-ink-faint">
          Your contact details go only to this provider.
        </p>
      </div>
    </form>
  );
}
