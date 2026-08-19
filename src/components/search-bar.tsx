"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MapPin, Search, Sparkle } from "@/components/icons";
import type { City, Service } from "@/lib/database.types";

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
    <form
      onSubmit={submit}
      className="rounded-panel border border-line bg-surface p-2 shadow-float"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <label className="flex flex-1 items-center gap-3 rounded-card px-3 py-2 transition-colors focus-within:bg-brand-50 sm:py-1.5">
          <MapPin className="size-5 shrink-0 text-brand-500" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium uppercase tracking-wide text-ink-faint">
              City
            </span>
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="-ms-1 w-full cursor-pointer appearance-none bg-transparent px-1 py-0.5 font-medium text-ink focus:outline-none"
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

        <span aria-hidden="true" className="hidden w-px bg-line-soft sm:block" />

        <label className="flex flex-1 items-center gap-3 rounded-card px-3 py-2 transition-colors focus-within:bg-brand-50 sm:py-1.5">
          <Sparkle className="size-5 shrink-0 text-brand-500" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium uppercase tracking-wide text-ink-faint">
              Type of care
            </span>
            <select
              value={service}
              onChange={(event) => setService(event.target.value)}
              className="-ms-1 w-full cursor-pointer appearance-none bg-transparent px-1 py-0.5 font-medium text-ink focus:outline-none"
            >
              <option value="">Any service</option>
              {services.map((option) => (
                <option key={option.id} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
          </span>
        </label>

        <button type="submit" className="btn btn-primary px-6 sm:px-7">
          <Search className="size-4.5" />
          Find care
        </button>
      </div>
    </form>
  );
}
