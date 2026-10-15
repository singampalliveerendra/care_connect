import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

let user: { id: string } | null = null;
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: async () => ({ data: { user } }) } }),
}));

const { updateSession } = await import("@/lib/supabase/middleware");
const visit = (path: string) => updateSession(new NextRequest(`https://carelyindia.com${path}`));

beforeEach(() => {
  user = null;
});

it.each([
  ["/admin", "https://carelyindia.com/admin/login"],
  ["/admin?status=approved", "https://carelyindia.com/admin/login"],
  ["/admin/anything", "https://carelyindia.com/admin/login"],
])("signed out: %s → admin sign in", async (path, target) => {
  const response = await visit(path);
  expect(response.headers.get("location")).toBe(target);
});

it.each(["/admin/login", "/", "/search", "/providers/asha", "/administrator"])("signed out: %s is not redirected", async (path) => {
  expect((await visit(path)).headers.get("location")).toBeNull();
});

it("REGRESSION: the provider portal still sends signed-out visitors to provider login", async () => {
  expect((await visit("/provider/dashboard")).headers.get("location")).toBe(
    "https://carelyindia.com/provider/login?next=%2Fprovider%2Fdashboard",
  );
});

it("signed in: /admin passes through to the page, which checks the role", async () => {
  user = { id: "u1" };
  expect((await visit("/admin")).headers.get("location")).toBeNull();
});
