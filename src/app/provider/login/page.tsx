import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Provider login",
  robots: { index: false },
};

export default async function ProviderLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-3xl">Provider sign in</h1>
      <p className="mt-2 text-ink-soft">
        Manage your listing and see the care requests families have sent you.
      </p>

      <div className="mt-8">
        <AuthForm next={next} />
      </div>

      <p className="mt-8 text-sm text-ink-faint">
        New to CareConnect?{" "}
        <Link href="/provider/register" className="text-brand-700 underline underline-offset-2">
          List your service
        </Link>
        .
      </p>
    </div>
  );
}
