import { beforeEach, describe, expect, it, vi } from "vitest";

const PROVIDER = "af6b749b-d333-4ed0-a157-fc33fc412a78";

const db = {
  user: { id: "admin-1" } as { id: string } | null,
  role: "admin" as string | null,
  rpcError: null as { code: string; message: string } | null,
  rpcCalls: [] as unknown[],
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: db.user } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: db.role ? { role: db.role } : null }) }),
      }),
    }),
    rpc: async (name: string, args: unknown) => {
      db.rpcCalls.push({ name, args });
      return { data: db.rpcError ? null : "approved", error: db.rpcError };
    },
  }),
}));
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));

const { reviewProvider } = await import("@/app/admin/actions");

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.append(k, v);
  return data;
};

beforeEach(() => {
  db.user = { id: "admin-1" };
  db.role = "admin";
  db.rpcError = null;
  db.rpcCalls = [];
  revalidatePath.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("reviewProvider", () => {
  it.each(["approved", "rejected", "suspended", "pending"])("admin can set %s", async (decision) => {
    const state = await reviewProvider({}, form({ providerId: PROVIDER, decision, notes: "  checked  " }));
    expect(state.error).toBeUndefined();
    expect(state.done).toBeTruthy();
    expect(db.rpcCalls).toEqual([
      { name: "admin_review_provider", args: { p_provider_id: PROVIDER, p_decision: decision, p_notes: "checked" } },
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("blank notes are sent as null", async () => {
    await reviewProvider({}, form({ providerId: PROVIDER, decision: "approved", notes: "   " }));
    expect((db.rpcCalls[0] as { args: { p_notes: unknown } }).args.p_notes).toBeNull();
  });

  it("signed-out users are refused before the database", async () => {
    db.user = null;
    expect((await reviewProvider({}, form({ providerId: PROVIDER, decision: "approved" }))).error).toMatch(/sign in/i);
    expect(db.rpcCalls).toEqual([]);
  });

  it("a provider account is refused before the database", async () => {
    db.role = "provider";
    expect((await reviewProvider({}, form({ providerId: PROVIDER, decision: "approved" }))).error).toMatch(/Only admins/);
    expect(db.rpcCalls).toEqual([]);
  });

  it.each([
    [{ providerId: "not-a-uuid", decision: "approved" }],
    [{ providerId: PROVIDER, decision: "draft" }],
    [{ providerId: PROVIDER, decision: "deleted" }],
    [{ providerId: PROVIDER }],
    [{ providerId: PROVIDER, decision: "approved", notes: "x".repeat(1001) }],
  ])("rejects bad input %j", async (fields) => {
    expect((await reviewProvider({}, form(fields as Record<string, string>))).error).toBeTruthy();
    expect(db.rpcCalls).toEqual([]);
  });

  it.each([
    ["P0002", /no longer exists/],
    ["42501", /Only admins/],
    ["XX000", /couldn't save/],
  ])("maps database error %s", async (code, message) => {
    db.rpcError = { code, message: "boom" };
    const state = await reviewProvider({}, form({ providerId: PROVIDER, decision: "approved" }));
    expect(state.error).toMatch(message);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
