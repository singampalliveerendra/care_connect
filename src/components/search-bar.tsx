"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-sm sm:flex-row sm:items-end"
    >
      <label className="flex-1">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-faint">
          City
        </span>
        <select
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="w-full rounded-card border border-line bg-surface px-3 py-2.5 text-ink"
        >
          <option value="">All active cities</option>
          {cities.map((option) => (
            <option key={option.id} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex-1">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-faint">
          Type of care
        </span>
        <select
          value={service}
          onChange={(event) => setService(event.target.value)}
          className="w-full rounded-card border border-line bg-surface px-3 py-2.5 text-ink"
        >
          <option value="">Any service</option>
          {services.map((option) => (
            <option key={option.id} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="rounded-card bg-brand-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-700"
      >
        Find care
      </button>
    </form>
  );
}
