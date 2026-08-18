"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { providerRegistrationSchema } from "@/lib/validation";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  notice?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter an email and password." };
  if (password.length < 8) {
    return { fieldErrors: { password: "Use at least 8 characters." } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: error.message };

  if (!data.session) {
    return {
      notice:
        "Check your email to confirm your address, then sign in to finish your listing.",
    };
  }

  await supabase.from("profiles").upsert({ id: data.user!.id, role: "provider" });
  redirect("/provider/register");
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/provider/dashboard");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "That email and password don't match an account." };

  redirect(next.startsWith("/provider") ? next : "/provider/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function registerProvider(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in again." };

  const parsed = providerRegistrationSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    cityId: formData.get("cityId"),
    serviceIds: formData.getAll("serviceIds"),
    areasCovered: String(formData.get("areasCovered") ?? "")
      .split(",")
      .map((area) => area.trim())
      .filter(Boolean),
    languages: formData.getAll("languages"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    website: formData.get("website") ?? "",
    address: formData.get("address") ?? "",
    addressIsPublic: formData.get("addressIsPublic") === "on",
    pricingBand: formData.get("pricingBand") || undefined,
    establishedYear: formData.get("establishedYear") || undefined,
    staffSize: formData.get("staffSize") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please check the highlighted fields.", fieldErrors };
  }

  const input = parsed.data;
  await supabase.from("profiles").upsert({ id: user.id, role: "provider" });

  const slug = `${slugify(input.name)}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .insert({
      owner_id: user.id,
      name: input.name,
      slug,
      description: input.description,
      city_id: input.cityId,
      areas_covered: input.areasCovered,
      languages: input.languages,
      phone: input.phone,
      email: input.email,
      website: input.website ?? null,
      address: input.address ?? null,
      address_is_public: input.addressIsPublic,
      pricing_band: input.pricingBand ?? null,
      established_year: input.establishedYear ?? null,
      staff_size: input.staffSize ?? null,
      // Brief §6.2/§30: a new listing is never public until an admin approves it.
      status: "pending",
      verification: "unverified",
      tier: "free",
    })
    .select("id")
    .single();

  if (providerError || !provider) {
    return { error: providerError?.message ?? "We couldn't save your listing." };
  }

  await supabase
    .from("provider_services")
    .insert(input.serviceIds.map((serviceId) => ({
      provider_id: provider.id,
      service_id: serviceId,
    })));

  await supabase.from("provider_applications").insert({
    provider_id: provider.id,
    submitted_by: user.id,
    status: "submitted",
  });

  revalidatePath("/provider/dashboard");
  redirect("/provider/dashboard");
}
