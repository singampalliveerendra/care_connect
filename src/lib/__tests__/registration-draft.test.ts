// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearDraft, DRAFT_KEY, readDraft, writeDraft, type RegistrationDraft } from "@/lib/registration-draft";

const draft = (overrides: Partial<RegistrationDraft> = {}): RegistrationDraft => ({
  owner: "asha@example.org",
  values: { name: "Asha Health Care" },
  checked: { serviceIds: ["s1"] },
  phone: "+91 90000 10001",
  whatsapp: "",
  sameWhatsapp: true,
  location: "https://maps.app.goo.gl/9myTcwVT1taauRVz5",
  coords: { latitude: 17.671427, longitude: 83.203612 },
  step: 2,
  savedAt: Date.now(),
  ...overrides,
});

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("registration draft", () => {
  it("round-trips", () => {
    writeDraft(draft());
    expect(readDraft("asha@example.org")).toEqual(draft({ savedAt: readDraft("asha@example.org")!.savedAt }));
  });

  it("is not handed to a different account", () => {
    writeDraft(draft());
    expect(readDraft("someone@else.org")).toBeNull();
  });

  it("expires after 30 days", () => {
    writeDraft(draft({ savedAt: Date.now() - 31 * 24 * 60 * 60 * 1000 }));
    expect(readDraft("asha@example.org")).toBeNull();
  });

  it("clears", () => {
    writeDraft(draft());
    clearDraft();
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it.each(["not json", "null", "[]", '{"owner":"asha@example.org"}'])("ignores corrupt data %s", (raw) => {
    localStorage.setItem(DRAFT_KEY, raw);
    expect(readDraft("asha@example.org")).toBeNull();
  });

  it("drops wrongly typed parts instead of crashing", () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ owner: "asha@example.org", savedAt: Date.now(), values: { name: 5, city: "x" }, checked: { serviceIds: [1, "s1"], x: "y" }, coords: { latitude: "a" }, step: 9 }),
    );
    expect(readDraft("asha@example.org")).toMatchObject({
      values: { city: "x" },
      checked: { serviceIds: ["s1"] },
      coords: null,
      step: 0,
      sameWhatsapp: true,
    });
  });

  it("never throws when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    expect(readDraft("asha@example.org")).toBeNull();
    expect(() => writeDraft(draft())).not.toThrow();
  });
});
