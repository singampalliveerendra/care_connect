"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MapPin, Search } from "@/components/icons";
import type { City, Service } from "@/lib/database.types";

/**
 * Location on the left, what you need on the right, orange button to run it.
 *
 * The two fields are visually separate boxes rather than one bar: on a phone
 * they stack into two obvious questions, and on desktop the split makes it
 * clear that changing the city and changing the service are different acts.
 * Orange appears exactly once on the page, here — it is the control everything
 * else on the screen depends on.
 */
export function SearchBar({
  cities,
  services,
  defaultCity,
  defaultService,
}: {
  cities: City[];
  services: Service[];
  defaultCity?: string;
  defaultService?: string;
}) {
  const router = useRouter();
  const [city, setCity] = useState(defaultCity ?? "");
  const [service, setService] = useState(defaultService ?? "");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (service) params.set("service", service);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row">
      <label className="flex flex-1 items-center gap-2.5 rounded-card border border-line-strong bg-surface px-3.5 py-2.5 transition-colors focus-within:border-brand-600 sm:max-w-xs">
        <MapPin className="size-5 shrink-0 text-accent-500" />
        <span className="min-w-0 flex-1">
          <span className="block text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-faint">
            Location
          </span>
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            aria-label="City"
            className="-ms-0.5 w-full cursor-pointer appearance-none bg-transparent py-0.5 font-medium text-ink focus:outline-none"
          >
            <option value="">All active cities</option>
            {cities.map((option) => (
              <option key={option.id} value={option.slug}>
                {option.name}
              </option>
            ))}
          </select>
        </span>
      </label>

      <div className="flex flex-1 gap-2.5">
        <label className="flex flex-1 items-center gap-2.5 rounded-card border border-line-strong bg-surface px-3.5 py-2.5 transition-colors focus-within:border-brand-600">
          <Search className="size-5 shrink-0 text-ink-faint" />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-faint">
              What do you need?
            </span>
            <select
              value={service}
              onChange={(event) => setService(event.target.value)}
              aria-label="Type of care"
              className="-ms-0.5 w-full cursor-pointer appearance-none bg-transparent py-0.5 font-medium text-ink focus:outline-none"
            >
              <option value="">Any type of care</option>
              {services.map((option) => (
                <option key={option.id} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
          </span>
        </label>

        <button type="submit" className="btn btn-search px-6 sm:px-8">
          <Search className="size-4.5" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </form>
  );
}
