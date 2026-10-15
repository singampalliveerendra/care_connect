import { beforeEach, describe, expect, it, vi } from "vitest";

/* registerProvider runs against a fake Supabase client: every insert is
   recorded, and each table's result can be overridden per test. Nothing here
   touches a real database. */

const CITY = "bc23fbfc-3788-47af-a2e5-f4ea4d0325f0";
const SERVICE = "9f8cc3fd-0554-4c75-9eda-a2a008211f94";

type Result = { data?: unknown; error?: { message: string } | null };
const db = {
  user: { id: "user-1", email: "asha@example.org" } as { id: string; email: string } | null,
  inserts: [] as { table: string; row: unknown; options?: unknown }[],
  results: {} as Record<string, Result>,
};

function from(table: string) {
  const result = () => db.results[table] ?? { data: table === "providers" ? { id: "prov-1" } : null, error: null };
  const chain = {
    insert(row: unknown) {
      db.inserts.push({ table, row });
      return chain;
    },
    upsert(row: unknown, options?: unknown) {
      db.inserts.push({ table: `${table}:upsert`, row, options });
      return chain;
    },
    select: () => chain,
    single: () => Promise.resolve(result()),
    then: (resolve: (value: Result) => unknown) => Promise.resolve(result()).then(resolve),
  };
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: db.user } }),
      signInWithPassword: async () => ({ error: null }),
    },
    from,
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const resolveShortLink = vi.fn();
vi.mock("@/lib/location", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/location")>()),
  resolveShortLink: (...args: unknown[]) => resolveShortLink(...args),
}));

const { authenticate, registerProvider, resolveMapsLocation } = await import("@/app/provider/actions");

function form(overrides: Record<string, string | string[] | null> = {}) {
  const fields: Record<string, string | string[] | null> = {
    name: "Asha Health Care",
    description: "Old age home with 24x7 nursing care and trained attendants in Gajuwaka.",
    cityId: CITY,
    serviceIds: [SERVICE],
    areasCovered: "Gajuwaka, Old Gajuwaka",
    phone: "+91 90000 10001",
    whatsapp: "+91 90000 10001",
    email: "asha@example.org",
    website: "",
    address: "Door No 21-54-31, Beside Mamata Hospital, Gajuwaka, Visakhapatnam-530026",
    addressIsPublic: "on",
    location: "",
    pricingBand: "",
    establishedYear: "",
    staffSize: "",
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === null) continue;
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return data;
}

async function submit(data: FormData) {
  try {
    return { state: await registerProvider({}, data), redirectedTo: null };
  } catch (error) {
    const url = (error as { url?: string }).url;
    if (!url) throw error;
    return { state: null, redirectedTo: url };
  }
}

const providerRow = () =>
  db.inserts.find((insert) => insert.table === "providers")?.row as Record<string, unknown> | undefined;

beforeEach(() => {
  db.user = { id: "user-1", email: "asha@example.org" };
  db.inserts = [];
  db.results = {};
  resolveShortLink.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("registerProvider — success", () => {
  it("creates a pending, unverified care home and goes to the dashboard", async () => {
    const { redirectedTo } = await submit(form());
    expect(redirectedTo).toBe("/provider/dashboard");
    expect(providerRow()).toMatchObject({
      owner_id: "user-1",
      name: "Asha Health Care",
      city_id: CITY,
      areas_covered: ["Gajuwaka", "Old Gajuwaka"],
      address_is_public: true,
      status: "pending",
      verification: "unverified",
      tier: "free",
    });
    expect(db.inserts.map((insert) => insert.table)).toEqual([
      "profiles:upsert",
      "providers",
      "provider_services",
      "provider_applications",
    ]);
  });

  it("SECURITY: never writes the role column, and never overwrites an existing profile", async () => {
    await submit(form());
    expect(db.inserts.find((insert) => insert.table === "profiles:upsert")).toEqual({
      table: "profiles:upsert",
      row: { id: "user-1" },
      options: { onConflict: "id", ignoreDuplicates: true },
    });
  });

  it("REGRESSION: no location saves null coordinates, not 0, 0", async () => {
    await submit(form());
    expect(providerRow()).toMatchObject({ latitude: null, longitude: null });
  });

  it("saves the pin the form resolved into hidden fields", async () => {
    await submit(form({ location: "https://maps.app.goo.gl/x", latitude: "17.671417", longitude: "83.210111" }));
    expect(providerRow()).toMatchObject({ latitude: 17.671417, longitude: 83.210111 });
    expect(resolveShortLink).not.toHaveBeenCalled();
  });

  it.each([
    [`17°40'17.1"N 83°12'36.4"E`, 17.671417, 83.210111],
    ["17.6868, 83.2185", 17.6868, 83.2185],
    ["https://www.google.com/maps/place/X/@17.7,83.2,17z/data=!3d17.6714!4d83.2101", 17.6714, 83.2101],
  ])("reads pasted %s on the server when hidden fields are missing", async (location, lat, lng) => {
    const { redirectedTo } = await submit(form({ location }));
    expect(redirectedTo).toBe("/provider/dashboard");
    expect(providerRow()).toMatchObject({ latitude: lat, longitude: lng });
  });

  it("resolves a share link on the server when the form didn't", async () => {
    resolveShortLink.mockResolvedValue({ kind: "coordinates", coordinates: { latitude: 17.6, longitude: 83.2 } });
    await submit(form({ location: "https://maps.app.goo.gl/AbC" }));
    expect(resolveShortLink).toHaveBeenCalledWith("https://maps.app.goo.gl/AbC");
    expect(providerRow()).toMatchObject({ latitude: 17.6, longitude: 83.2 });
  });

  it("accepts a landline as the contact number", async () => {
    const { redirectedTo } = await submit(form({ phone: "0891 2345678", whatsapp: "" }));
    expect(redirectedTo).toBe("/provider/dashboard");
    expect(providerRow()).toMatchObject({ phone: "0891 2345678", whatsapp: null });
  });
});

describe("registerProvider — rejected input saves nothing", () => {
  it.each([
    [{ location: "Gajuwaka" }, "location"],
    [{ location: "0, 0" }, "location"],
    [{ location: "83.2185, 17.6868" }, "location"],
    [{ location: "", latitude: "17.6", longitude: null }, "location"],
    [{ latitude: "0", longitude: "0" }, "location"],
    [{ description: "Too short" }, "description"],
    [{ serviceIds: [] }, "serviceIds"],
    [{ cityId: "" }, "cityId"],
    [{ phone: "12345" }, "phone"],
  ])("%j → error on %s", async (overrides, field) => {
    const { state, redirectedTo } = await submit(form(overrides as Record<string, string>));
    expect(redirectedTo).toBeNull();
    expect(state?.fieldErrors?.[field]).toBeTruthy();
    expect(providerRow()).toBeUndefined();
  });

  it("a share link that can't be resolved is reported, not dropped", async () => {
    resolveShortLink.mockResolvedValue({ kind: "invalid", message: "We couldn't open that share link." });
    const { state } = await submit(form({ location: "https://maps.app.goo.gl/dead" }));
    expect(state?.fieldErrors?.location).toContain("share link");
    expect(providerRow()).toBeUndefined();
  });

  it("signed-out users are turned away", async () => {
    db.user = null;
    const { state } = await submit(form());
    expect(state?.error).toMatch(/sign in/i);
    expect(db.inserts).toEqual([]);
  });
});

describe("registerProvider — database failures", () => {
  it("a failed provider insert shows a friendly error, not the raw database message", async () => {
    db.results.providers = { data: null, error: { message: 'duplicate key value violates unique constraint "providers_slug_key"' } };
    const { state, redirectedTo } = await submit(form());
    expect(redirectedTo).toBeNull();
    expect(state?.error).toMatch(/couldn't save your listing/);
    expect(state?.error).not.toMatch(/duplicate key/);
    expect(console.error).toHaveBeenCalled();
  });

  it("a failed services insert is logged and the provider still reaches the dashboard", async () => {
    db.results.provider_services = { error: { message: "rls" } };
    const { redirectedTo } = await submit(form());
    expect(redirectedTo).toBe("/provider/dashboard");
    expect(console.error).toHaveBeenCalledWith("registerProvider: services insert failed", "prov-1", { message: "rls" });
  });
});

describe("resolveMapsLocation", () => {
  it("requires a signed-in user", async () => {
    db.user = null;
    expect(await resolveMapsLocation("https://maps.app.goo.gl/x")).toEqual({ error: "Please sign in again." });
    expect(resolveShortLink).not.toHaveBeenCalled();
  });

  it("returns coordinates for a share link", async () => {
    resolveShortLink.mockResolvedValue({ kind: "coordinates", coordinates: { latitude: 17.6, longitude: 83.2 } });
    expect(await resolveMapsLocation("https://maps.app.goo.gl/x")).toEqual({ coordinates: { latitude: 17.6, longitude: 83.2 } });
  });

  it("returns the parser's message for junk", async () => {
    expect((await resolveMapsLocation("hello")).error).toBeTruthy();
    expect((await resolveMapsLocation(123 as unknown as string)).error).toBeTruthy();
  });
});

describe("authenticate — sign-in redirect", () => {
  const signIn = async (next: string) => {
    const data = new FormData();
    data.append("mode", "signin");
    data.append("email", "admin@carelyindia.com");
    data.append("password", "x".repeat(12));
    data.append("next", next);
    try {
      await authenticate({}, data);
      return null;
    } catch (error) {
      return (error as { url?: string }).url;
    }
  };

  it.each([
    ["/admin", "/admin"],
    ["/admin?status=approved", "/admin?status=approved"],
    ["/provider/leads", "/provider/leads"],
    ["https://evil.example", "/provider/dashboard"],
    ["//evil.example", "/provider/dashboard"],
    ["/administrator-phish", "/provider/dashboard"],
    ["/", "/provider/dashboard"],
  ])("next=%s lands on %s", async (next, expected) => {
    expect(await signIn(next)).toBe(expected);
  });
});
