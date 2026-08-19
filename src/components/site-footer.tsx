import Link from "next/link";

import { Logomark } from "@/components/icons";

const columns = [
  {
    title: "Find care",
    links: [
      { href: "/search", label: "Search providers" },
      { href: "/nri", label: "For NRI families" },
      { href: "/how-it-works", label: "How it works" },
    ],
  },
  {
    title: "Providers",
    links: [
      { href: "/provider/register", label: "List your service" },
      { href: "/provider/login", label: "Provider login" },
    ],
  },
  {
    title: "CareConnect",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms & disclaimer" },
    ],
  },
];

/**
 * No top margin here on purpose: pages own their own bottom spacing, and
 * full-bleed closing bands (the homepage provider CTA, for one) need to sit
 * flush against the footer rather than floating above it.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface-alt">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-brand-700"
            aria-label="CareConnect India — home"
          >
            <Logomark className="size-8" />
            <span className="font-display text-lg leading-none">CareConnect India</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
            Your parents are in India. Their care doesn&rsquo;t have to be.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-faint">
              {column.title}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-ink-soft transition-colors hover:text-brand-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-ink-faint">
          <p className="max-w-2xl leading-relaxed">
            CareConnect helps families discover and contact care providers. We are not a
            care provider ourselves, and we do not supervise the care that providers
            deliver.
          </p>
          <p>&copy; {new Date().getFullYear()} CareConnect India</p>
        </div>
      </div>
    </footer>
  );
}
