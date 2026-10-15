import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/provider/actions", () => ({
  registerProvider: vi.fn(),
  resolveMapsLocation: vi.fn(),
}));

const { ProviderRegistrationForm } = await import("@/components/provider-registration-form");

describe("ProviderRegistrationForm render", () => {
  const html = renderToString(
    <ProviderRegistrationForm
      cities={[{ id: "c1", name: "Visakhapatnam" } as never]}
      catalogue={[{ id: "cat", name: "Residential", services: [{ id: "s1", name: "Senior Living" }] } as never]}
      defaultEmail="asha@example.org"
    />,
  );

  it("offers a paste-a-location field alongside the GPS button", () => {
    expect(html).toContain('name="location"');
    expect(html).toContain("maps.app.goo.gl");
    expect(html).toContain("Use my current location");
  });

  it("REGRESSION: sends no coordinates until a pin is set", () => {
    expect(html).not.toContain('name="latitude"');
    expect(html).not.toContain('name="longitude"');
  });

  it("keeps the existing fields", () => {
    for (const field of ["name", "description", "cityId", "serviceIds", "phone", "whatsapp", "email", "website", "address", "addressIsPublic"]) {
      expect(html).toContain(`name="${field}"`);
    }
  });
});
