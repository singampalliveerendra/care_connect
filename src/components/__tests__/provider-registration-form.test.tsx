import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/provider/actions", () => ({
  registerProvider: vi.fn(),
  resolveMapsLocation: vi.fn(),
}));

const { ProviderRegistrationForm } = await import("@/components/provider-registration-form");

describe("ProviderRegistrationForm server render", () => {
  it("renders a placeholder on the server; the form (and its saved draft) loads in the browser", () => {
    const html = renderToString(
      <ProviderRegistrationForm cities={[]} catalogue={[]} defaultEmail="asha@example.org" />,
    );
    expect(html).toContain("Loading the form");
    expect(html).not.toContain("<form");
  });
});
