"use client";

import { useActionState, useRef, useState, useTransition, type MouseEvent } from "react";
import { flushSync } from "react-dom";

import { registerProvider, resolveMapsLocation, type ActionState } from "@/app/provider/actions";
import { Directions, WhatsApp } from "@/components/icons";
import { LANGUAGES, PRICING_BANDS, PRICING_BAND_LABEL, STAFF_SIZES } from "@/lib/domain";
import type { City } from "@/lib/database.types";
import { mapsSearchUrl, parseLocation, type Coordinates } from "@/lib/location";
import { firstStepWithError, REGISTRATION_STEPS } from "@/lib/registration-steps";
import type { CategoryWithServices } from "@/lib/queries";

const fieldClass = "w-full rounded-card border border-line bg-surface px-3 py-2.5 text-ink";

const STEPS = REGISTRATION_STEPS;

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
  const stepRefs = useRef<(HTMLFieldSetElement | null)[]>([]);

  /* A server-side error may belong to a step that is currently hidden — a
     "Please check the highlighted fields" banner with nothing highlighted on
     screen. Open the first step that has one, once per response. */
  const [shownState, setShownState] = useState(state);
  if (state !== shownState) {
    setShownState(state);
    const errorStep = firstStepWithError(state.fieldErrors);
    if (errorStep !== null) setStep(errorStep);
  }

  /** Shows the browser's own message on the first invalid field of `index`. */
  function revealInvalid(index: number) {
    flushSync(() => setStep(index));
    stepRefs.current[index]?.reportValidity();
  }

  function goForward() {
    if (stepRefs.current[step]?.checkValidity() === false) {
      stepRefs.current[step]?.reportValidity();
      return;
    }
    setStep(step + 1);
  }

  /* Hidden steps stay mounted, and the browser refuses to submit a form whose
     invalid field is display:none — without showing anything, because it
     can't focus the field. That made "Submit for review" look dead whenever
     something on step 1 or 2 was missing. Check every step first and open the
     one that needs attention. */
  function checkAllSteps(event: MouseEvent<HTMLButtonElement>) {
    const invalid = stepRefs.current.findIndex((fieldset) => fieldset?.checkValidity() === false);
    if (invalid === -1) return;
    event.preventDefault();
    revealInvalid(invalid);
  }

  /* Most small providers answer calls and WhatsApp on the same handset, so the
     box is ticked by default and the second number simply mirrors the first.
     The ones who run a separate WhatsApp line untick it — but nobody has to
     type ten digits twice to describe the common case. */
  const [phone, setPhone] = useState("");
  const [sameWhatsapp, setSameWhatsapp] = useState(true);
  const [whatsapp, setWhatsapp] = useState("");

  /* The location text is the single source of truth: the GPS button writes
     coordinates into it, and pasting a link or coordinates fills it directly.
     `coords` is what that text resolved to. */
  const [locationText, setLocationText] = useState("");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [resolving, startResolving] = useTransition();
  const lookupId = useRef(0);

  function readLocation(text: string) {
    setLocationText(text);
    const id = ++lookupId.current;
    const parsed = parseLocation(text);

    if (parsed.kind === "coordinates") {
      setCoords(parsed.coordinates);
      setLocationError(null);
      return;
    }

    setCoords(null);
    if (parsed.kind === "empty") {
      setLocationError(null);
    } else if (parsed.kind === "invalid") {
      setLocationError(parsed.message);
    } else {
      // A share link: only the server can follow its redirect.
      setLocationError(null);
      startResolving(async () => {
        const result = await resolveMapsLocation(parsed.url);
        if (id !== lookupId.current) return; // the text changed meanwhile
        setCoords(result.coordinates ?? null);
        setLocationError(result.error ?? null);
      });
    }
  }

  function clearLocation() {
    lookupId.current++;
    setLocationText("");
    setCoords(null);
    setLocationError(null);
  }

  function dropPin() {
    if (!("geolocation" in navigator)) {
      setLocationError("This browser can't share a location. You can skip this.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        // Six decimals is roughly 0.1 m — past that the column would round
        // anyway, and the extra digits are noise from the device.
        readLocation(
          `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
        );
      },
      (error) => {
        setLocating(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was declined. This is optional — carry on without it."
            : "We couldn't read your location just now. You can try again or skip it.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

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
      <fieldset
        ref={(el) => {
          stepRefs.current[0] = el;
        }}
        className={step === 0 ? "space-y-4" : "hidden"}
      >
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
            {error("establishedYear")}
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
      <fieldset
        ref={(el) => {
          stepRefs.current[1] = el;
        }}
        className={step === 1 ? "space-y-5" : "hidden"}
      >
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
          {error("areasCovered")}
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
      <fieldset
        ref={(el) => {
          stepRefs.current[2] = el;
        }}
        className={step === 2 ? "space-y-4" : "hidden"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Contact phone</span>
            <input
              name="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={fieldClass}
              placeholder="+91 90000 10001 or 0891 2345678"
              autoComplete="tel"
              required
            />
            <span className="mt-1 block text-xs text-ink-faint">
              Shown on your listing so families can call you directly. A mobile or a landline with its STD code.
            </span>
            {error("phone")}
          </label>

          {/* Two controls, so two labels — a checkbox nested inside the text
              field's own <label> would leave the browser guessing which one a
              click on the words belongs to. */}
          <div className="block">
            <label htmlFor="whatsapp" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
              <WhatsApp className="size-4 text-whatsapp-deep" />
              WhatsApp number
              <span className="font-normal text-ink-faint">optional</span>
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              value={sameWhatsapp ? phone : whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              readOnly={sameWhatsapp}
              className={`${fieldClass} ${sameWhatsapp ? "bg-surface-alt text-ink-soft" : ""}`}
              placeholder="+91 90000 10001"
            />
            <label className="mt-1.5 flex items-center gap-2 text-xs text-ink-faint">
              <input
                type="checkbox"
                checked={sameWhatsapp}
                onChange={(event) => setSameWhatsapp(event.target.checked)}
                className="accent-brand-600"
              />
              Same as my contact phone
            </label>
            {error("whatsapp")}
          </div>
        </div>

        <label className="block sm:max-w-sm">
          <span className="mb-1.5 block text-sm font-medium">Contact email</span>
          <input name="email" type="email" defaultValue={defaultEmail} className={fieldClass} required />
          {error("email")}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Website</span>
          <input name="website" type="url" className={fieldClass} placeholder="https://" />
          {error("website")}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Address</span>
          <textarea name="address" rows={2} maxLength={300} className={fieldClass} />
          {error("address")}
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="addressIsPublic" className="accent-brand-600" />
          Show this address on my public profile
        </label>

        {/* Optional map pin. Written addresses in Indian cities are frequently
            unroutable ("behind the water tank, second lane"), so a pin gives
            families a Directions link that actually works. Most providers fill
            this in away from the premises, so pasting from Google Maps is the
            main path; the GPS button is for those standing at the gate.
            Skipping it costs the listing nothing. */}
        <div className="rounded-card border border-line bg-surface-alt p-4">
          <label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
            <Directions className="size-4 text-brand-600" />
            Map location
            <span className="font-normal text-ink-faint">optional</span>
          </label>
          <p id="location-help" className="mt-1 text-sm text-ink-soft">
            In Google Maps, find your building, then copy its share link or the
            coordinates from its pin and paste them here. Families get a working
            &ldquo;Directions&rdquo; link on your listing.
          </p>

          <input
            id="location"
            name="location"
            value={locationText}
            onChange={(event) => readLocation(event.target.value)}
            className={`${fieldClass} mt-3`}
            placeholder="https://maps.app.goo.gl/… or 17.6868, 83.2185"
            aria-describedby="location-help location-status"
            aria-invalid={Boolean(locationError || state.fieldErrors?.location)}
            autoComplete="off"
            spellCheck={false}
            maxLength={2048}
          />

          {coords && (
            <>
              <input type="hidden" name="latitude" value={coords.latitude} />
              <input type="hidden" name="longitude" value={coords.longitude} />
            </>
          )}

          <div id="location-status" className="mt-3 flex flex-wrap items-center gap-3" aria-live="polite">
            <button
              type="button"
              onClick={dropPin}
              disabled={locating}
              className="rounded-card border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-brand-300 disabled:opacity-60"
            >
              {locating ? "Finding you…" : "Use my current location"}
            </button>

            {resolving && <span className="text-sm text-ink-faint">Reading the link…</span>}

            {coords && !resolving && (
              <>
                <span className="text-sm text-success-700">
                  Pin set &middot; {coords.latitude}, {coords.longitude}
                </span>
                <a
                  href={mapsSearchUrl(coords)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-700 underline underline-offset-2"
                >
                  Check it
                </a>
              </>
            )}

            {locationText && (
              <button
                type="button"
                onClick={clearLocation}
                className="text-sm text-ink-faint underline underline-offset-2"
              >
                Remove
              </button>
            )}
          </div>

          {locationError && (
            <p className="mt-2 text-xs text-danger-500" role="status">
              {locationError}
            </p>
          )}
          {!locationError && error("location")}
        </div>

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
            onClick={goForward}
            className="rounded-card bg-brand-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-700"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            onClick={checkAllSteps}
            disabled={pending || resolving}
            className="rounded-card bg-brand-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Submitting…" : "Submit for review"}
          </button>
        )}
      </div>
    </form>
  );
}
