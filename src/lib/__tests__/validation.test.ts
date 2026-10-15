import { describe, expect, it } from "vitest";

import { firstStepWithError } from "@/lib/registration-steps";
import { enquirySchema, providerRegistrationSchema } from "@/lib/validation";

const CITY = "bc23fbfc-3788-47af-a2e5-f4ea4d0325f0";
const SERVICE = "9f8cc3fd-0554-4c75-9eda-a2a008211f94";

/** What the server action builds from a fully filled form with no pin. */
const valid = {
  name: "Asha Health Care",
  description: "Old age home with 24x7 nursing care and trained attendants in Gajuwaka.",
  cityId: CITY,
  serviceIds: [SERVICE],
  areasCovered: ["Gajuwaka"],
  languages: ["Telugu"],
  phone: "+91 90000 10001",
  whatsapp: "+91 90000 10001",
  email: "asha@example.org",
  website: "",
  address: "Door No 21-54-31, Beside Mamata Hospital, Gajuwaka, Visakhapatnam-530026",
  addressIsPublic: true,
  latitude: "",
  longitude: "",
  pricingBand: undefined,
  establishedYear: undefined,
  staffSize: undefined,
};

const parse = (overrides: Record<string, unknown> = {}) =>
  providerRegistrationSchema.safeParse({ ...valid, ...overrides });

const fieldsWithErrors = (overrides: Record<string, unknown>) => {
  const result = parse(overrides);
  return result.success ? [] : result.error.issues.map((issue) => issue.path[0]);
};

describe("providerRegistrationSchema — positive", () => {
  it("accepts a complete care home without a pin", () => {
    const result = parse();
    expect(result.success).toBe(true);
  });

  it("REGRESSION: no pin stays empty instead of becoming 0, 0", () => {
    const result = parse();
    expect(result.success && result.data.latitude).toBeUndefined();
    expect(result.success && result.data.longitude).toBeUndefined();
  });

  it("keeps a valid pin as numbers", () => {
    const result = parse({ latitude: "17.671417", longitude: "83.210111" });
    expect(result.success && [result.data.latitude, result.data.longitude]).toEqual([17.671417, 83.210111]);
  });

  it.each([
    "+91 90000 10001",
    "+919876543210",
    "98765 43210",
    "9876543210",
    "+91-98765-43210",
    "09876543210",
    "0891 2345678",
    "0891-2345678",
    "(0891) 2345678",
    "040 23456789",
  ])("accepts contact phone %s", (phone) => {
    expect(parse({ phone, whatsapp: "" }).success).toBe(true);
  });

  it("accepts the optional fields filled in", () => {
    expect(
      parse({ website: "https://asha.example.org", pricingBand: "mid", establishedYear: "2015", staffSize: "10-25" })
        .success,
    ).toBe(true);
  });
});

describe("providerRegistrationSchema — negative", () => {
  it.each([
    [{ name: "A" }, "name"],
    [{ description: "Old age home in Gajuwaka" }, "description"],
    [{ cityId: "" }, "cityId"],
    [{ serviceIds: [] }, "serviceIds"],
    [{ email: "not-an-email" }, "email"],
    [{ website: "asha.in" }, "website"],
    [{ establishedYear: "1800" }, "establishedYear"],
    [{ address: "x".repeat(301) }, "address"],
  ])("%j is rejected on %s", (overrides, field) => {
    expect(fieldsWithErrors(overrides)).toContain(field);
  });

  it.each(["12345", "+44 20 7946 0958", "0891 23456", "abcdefghij", "0000000000"])(
    "rejects contact phone %s",
    (phone) => {
      expect(fieldsWithErrors({ phone })).toContain("phone");
    },
  );

  it.each(["040 23456789", "12345"])("WhatsApp must be a mobile, so %s is rejected", (whatsapp) => {
    expect(fieldsWithErrors({ whatsapp })).toContain("whatsapp");
  });

  it.each([
    [{ latitude: "17.6", longitude: "" }, "half a pin"],
    [{ latitude: "0", longitude: "0" }, "Null Island"],
    [{ latitude: "83.2", longitude: "17.6" }, "swapped"],
    [{ latitude: "51.5", longitude: "-0.12" }, "outside India"],
  ])("location %j (%s) is reported on the location field", (overrides) => {
    expect(fieldsWithErrors(overrides)).toEqual(["location"]);
  });

  it.each([
    [{ latitude: "abc", longitude: "83" }],
    [{ latitude: "95", longitude: "83" }],
  ])("non-numeric or out-of-range latitude %j", (overrides) => {
    expect(fieldsWithErrors(overrides)).toContain("latitude");
  });
});

describe("enquirySchema — regression, family phone rules unchanged", () => {
  const enquiry = {
    providerId: "af6b749b-d333-4ed0-a157-fc33fc412a78",
    cityId: CITY,
    serviceId: SERVICE,
    familyName: "Ravi",
    careRequirement: "My mother needs a day attendant after her hip surgery.",
  };
  it("still accepts a mobile", () => {
    expect(enquirySchema.safeParse({ ...enquiry, phone: "+91 98765 43210" }).success).toBe(true);
  });
  it("still rejects a landline", () => {
    expect(enquirySchema.safeParse({ ...enquiry, phone: "0891 2345678" }).success).toBe(false);
  });
});

describe("firstStepWithError", () => {
  it.each([
    [undefined, null],
    [{}, null],
    [{ description: "x" }, 0],
    [{ serviceIds: "x", phone: "y" }, 1],
    [{ phone: "x", location: "y" }, 2],
    [{ somethingNew: "x" }, 2],
    [{ location: "x", cityId: "y" }, 0],
  ])("%j → step %s", (errors, step) => {
    expect(firstStepWithError(errors as Record<string, string> | undefined)).toBe(step);
  });
});
