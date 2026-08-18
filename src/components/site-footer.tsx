import Link from "next/link";

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

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-surface-alt">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg text-brand-700">CareConnect India</p>
          <p className="mt-2 max-w-xs text-sm text-ink-soft">
            Your parents are in India. Their care doesn&rsquo;t have to be.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-faint">
              {column.title}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
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
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-ink-faint">
          CareConnect helps families discover and contact care providers. We are not a
          care provider ourselves, and we do not supervise the care that providers deliver.
        </p>
      </div>
    </footer>
  );
}
