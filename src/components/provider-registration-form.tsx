"use client";

import { useActionState, useState } from "react";

import { registerProvider, type ActionState } from "@/app/provider/actions";
import { LANGUAGES, PRICING_BANDS, PRICING_BAND_LABEL, STAFF_SIZES } from "@/lib/domain";
import type { City } from "@/lib/database.types";
import type { CategoryWithServices } from "@/lib/queries";

const fieldClass = "w-full rounded-card border border-line bg-surface px-3 py-2.5 text-ink";

const STEPS = ["Your organisation", "What you offer", "How families reach you"] as const;

export function ProviderRegistrationForm({
  cities,
  catalogue,
  defaultEmail,
}: {
  cities: City[];
  catalogue: CategoryWithServices[];
  defaultEmail: string;
}) {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    registerProvider,
    {},
  );

  const error = (field: string) =>
    state.fieldErrors?.[field] && (
      <span className="mt-1 block text-xs text-danger-500">{state.fieldErrors[field]}</span>
    );

  return (
    <form action={formAction} className="space-y-8">
      <ol className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-4 text-sm">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={index === step ? "font-medium text-brand-700" : "text-ink-faint"}
          >
            <button type="button" onClick={() => setStep(index)}>
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {/* Step 1 — kept mounted so nothing is lost when switching steps */}
      <fieldset className={step === 0 ? "space-y-4" : "hidden"}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Organisation name</span>
          <input name="name" className={fieldClass} required />
          {error("name")}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Describe your service
            <span className="ms-2 font-normal text-ink-faint">up to 500 characters</span>
          </span>
          <textarea name="description" rows={4} maxLength={500} className={fieldClass} required />
          {error("description")}
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">City</span>
            <select name="cityId" className={fieldClass} defaultValue="" required>
              <option value="" disabled>
                Choose a city
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            {error("cityId")}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Operating since</span>
            <input name="establishedYear" type="number" min={1900} max={new Date().getFullYear()} className={fieldClass} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Team size</span>
            <select name="staffSize" className={fieldClass} defaultValue="">
              <option value="">Prefer not to say</option>
              {STAFF_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} people
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      {/* Step 2 */}
      <fieldset className={step === 1 ? "space-y-5" : "hidden"}>
        <div>
          <span className="mb-2 block text-sm font-medium">Services you offer</span>
          <div className="space-y-4">
            {catalogue.map((category) => (
              <div key={category.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {category.name}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {category.services.map((service) => (
                    <label
                      key={service.id}
                      className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm has-checked:border-brand-600 has-checked:bg-brand-50"
                    >
                      <input type="checkbox" name="serviceIds" value={service.id} className="accent-brand-600" />
                      {service.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {error("serviceIds")}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Areas you cover
            <span className="ms-2 font-normal text-ink-faint">comma separated</span>
          </span>
          <input name="areasCovered" className={fieldClass} placeholder="MVP Colony, Seethammadhara, Dwaraka Nagar" />
        </label>

        <div>
          <span className="mb-2 block text-sm font-medium">Languages your staff speak</span>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((language) => (
              <label
                key={language}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm has-checked:border-brand-600 has-checked:bg-brand-50"
              >
                <input type="checkbox" name="languages" value={language} className="accent-brand-600" />
                {language}
              </label>
            ))}
          </div>
        </div>

        <label className="block max-w-xs">
          <span className="mb-1.5 block text-sm font-medium">Typical pricing</span>
          <select name="pricingBand" className={fieldClass} defaultValue="">
            <option value="">Prefer not to say</option>
            {PRICING_BANDS.map((band) => (
              <option key={band} value={band}>
                {PRICING_BAND_LABEL[band]}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      {/* Step 3 */}
      <fieldset className={step === 2 ? "space-y-4" : "hidden"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Contact phone</span>
            <input name="phone" type="tel" className={fieldClass} required />
            {error("phone")}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Contact email</span>
            <input name="email" type="email" defaultValue={defaultEmail} className={fieldClass} required />
            {error("email")}
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Website</span>
          <input name="website" type="url" className={fieldClass} placeholder="https://" />
          {error("website")}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Address</span>
          <textarea name="address" rows={2} className={fieldClass} />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="addressIsPublic" className="accent-brand-600" />
          Show this address on my public profile
        </label>

        <p className="rounded-card bg-surface-alt px-4 py-3 text-sm text-ink-soft">
          Your listing starts on the free tier and stays unverified until our team reviews
          it. Verification is never affected by what you pay.
        </p>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-card bg-danger-100 px-4 py-3 text-sm text-danger-500">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="rounded-card border border-line px-5 py-2.5 font-medium text-ink-soft"
          >
            Back
          </button>
        )}

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="rounded-card bg-brand-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-700"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="rounded-card bg-brand-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Submitting…" : "Submit for review"}
          </button>
        )}
      </div>
    </form>
  );
}
