import Link from "next/link";

const links = [
  { href: "/search", label: "Find care" },
  { href: "/nri", label: "For NRI families" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
        <Link href="/" className="font-display text-xl text-brand-700">
          CareConnect <span className="text-ink-faint">India</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ink-soft transition-colors hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-3 text-sm">
          <Link
            href="/provider/login"
            className="text-ink-soft transition-colors hover:text-brand-700"
          >
            Provider login
          </Link>
          <Link
            href="/provider/register"
            className="rounded-card border border-brand-600 px-3 py-1.5 font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            List your service
          </Link>
        </div>
      </div>
    </header>
  );
}
