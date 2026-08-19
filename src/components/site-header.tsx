"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Close, Logomark, Menu } from "@/components/icons";

const links = [
  { href: "/search", label: "Find care" },
  { href: "/nri", label: "For NRI families" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Route changes must close the sheet — otherwise tapping a link leaves the
  // menu covering the page it just navigated to.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ground/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-brand-700"
          aria-label="CareConnect India — home"
        >
          <Logomark className="size-8 shrink-0" />
          <span className="font-display text-xl leading-none">
            CareConnect <span className="text-ink-faint">India</span>
          </span>
        </Link>

        <nav className="ms-6 hidden items-center gap-1 text-sm lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                isActive(link.href)
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-ink-soft hover:bg-surface-alt hover:text-brand-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto hidden items-center gap-2 text-sm lg:flex">
          <Link href="/provider/login" className="btn btn-ghost px-3 py-2">
            Provider login
          </Link>
          <Link href="/provider/register" className="btn btn-secondary px-4 py-2">
            List your service
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="ms-auto flex size-10 items-center justify-center rounded-card border border-line bg-surface text-ink-soft lg:hidden"
        >
          {open ? <Close className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="animate-fade-in border-t border-line bg-surface px-5 pb-5 pt-3 lg:hidden"
        >
          <nav className="grid gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`rounded-card px-3 py-2.5 ${
                  isActive(link.href)
                    ? "bg-brand-50 font-medium text-brand-700"
                    : "text-ink-soft"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 grid gap-2 border-t border-line-soft pt-3">
            <Link href="/provider/login" className="btn btn-ghost justify-start px-3">
              Provider login
            </Link>
            <Link href="/provider/register" className="btn btn-secondary">
              List your service
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
