import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { isAdmin } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && (await isAdmin(supabase, user.id))) redirect("/admin");

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-3xl">Admin sign in</h1>
      <p className="mt-2 text-ink-soft">Review and approve care provider listings.</p>
      <div className="mt-8">
        <AuthForm next="/admin" signInOnly />
      </div>
    </div>
  );
}
