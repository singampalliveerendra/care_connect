// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* Drives the real form in a DOM, the way a provider does: fill some steps,
   press Submit. Regression for the bug where Submit did nothing because an
   invalid field sat on a hidden step. */

const registerProvider = vi.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();
vi.mock("@/app/provider/actions", () => ({
  registerProvider: (...args: unknown[]) => registerProvider(...args),
  resolveMapsLocation: vi.fn(),
}));

const { ProviderRegistrationForm } = await import("@/components/provider-registration-form");

function renderForm() {
  return render(
    <ProviderRegistrationForm
      cities={[{ id: "bc23fbfc-3788-47af-a2e5-f4ea4d0325f0", name: "Visakhapatnam" } as never]}
      catalogue={[{ id: "cat", name: "Residential", services: [{ id: "9f8cc3fd-0554-4c75-9eda-a2a008211f94", name: "Senior Living" }] } as never]}
      defaultEmail="asha@example.org"
    />,
  );
}

const field = (container: HTMLElement, name: string) =>
  container.querySelector(`[name="${name}"]`) as HTMLInputElement;
const stepVisible = (container: HTMLElement, index: number) =>
  !container.querySelectorAll("fieldset")[index].classList.contains("hidden");

function fillStep1(container: HTMLElement) {
  fireEvent.change(field(container, "name"), { target: { value: "Asha Health Care" } });
  fireEvent.change(field(container, "description"), {
    target: { value: "Old age home with 24x7 nursing care and trained attendants in Gajuwaka." },
  });
  fireEvent.change(field(container, "cityId"), { target: { value: "bc23fbfc-3788-47af-a2e5-f4ea4d0325f0" } });
}

function goToLastStep() {
  fireEvent.click(screen.getByText(/3\. How families reach you/));
}

function fillStep3(container: HTMLElement) {
  fireEvent.change(field(container, "phone"), { target: { value: "+91 90000 10001" } });
  fireEvent.change(field(container, "location"), { target: { value: "17.671427, 83.203612" } });
}

beforeEach(() => {
  registerProvider.mockReset();
  registerProvider.mockResolvedValue({});
  localStorage.clear();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe("Submit with a problem on a hidden step", () => {
  it("REGRESSION: opens step 1 and says which field, instead of doing nothing", async () => {
    const { container } = renderForm();
    goToLastStep();
    fillStep3(container);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Submit for review" })));

    expect(registerProvider).not.toHaveBeenCalled();
    expect(stepVisible(container, 0)).toBe(true);
    expect(screen.getByRole("alert").textContent).toMatch(/Step 1, Your organisation: Organisation name/);
    expect(document.activeElement).toBe(field(container, "name"));
  });

  it("points at an out-of-range year on step 1", async () => {
    const { container } = renderForm();
    fillStep1(container);
    fireEvent.change(field(container, "establishedYear"), { target: { value: "15" } });
    goToLastStep();
    fillStep3(container);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Submit for review" })));

    expect(registerProvider).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/Operating since/);
  });

  it("the message clears once the provider edits a field", async () => {
    const { container } = renderForm();
    goToLastStep();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Submit for review" })));
    expect(screen.queryByRole("alert")).not.toBeNull();
    fireEvent.change(field(container, "name"), { target: { value: "Asha" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("Continue", () => {
  it("won't leave step 1 with a required field empty", () => {
    const { container } = renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(stepVisible(container, 0)).toBe(true);
    expect(screen.getByRole("alert").textContent).toMatch(/Organisation name/);
  });

  it("moves on when step 1 is complete", () => {
    const { container } = renderForm();
    fillStep1(container);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(stepVisible(container, 1)).toBe(true);
  });
});

describe("Submit with everything valid", () => {
  it("calls the server action with the pasted pin", async () => {
    const { container } = renderForm();
    fillStep1(container);
    fireEvent.click(field(container, "serviceIds"));
    goToLastStep();
    fillStep3(container);

    expect(container.textContent).toMatch(/Pin set · 17.671427, 83.203612/);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Submit for review" })));

    expect(registerProvider).toHaveBeenCalledTimes(1);
    const data = (registerProvider.mock.calls[0] as unknown[])[1] as FormData;
    expect(data.get("name")).toBe("Asha Health Care");
    expect(data.get("latitude")).toBe("17.671427");
    expect(data.get("longitude")).toBe("83.203612");
    expect(data.get("whatsapp")).toBe("+91 90000 10001");
  });
});

describe("existing fields", () => {
  it("are all present", () => {
    const { container } = renderForm();
    for (const name of ["name", "description", "cityId", "serviceIds", "areasCovered", "languages", "pricingBand", "phone", "whatsapp", "email", "website", "address", "addressIsPublic", "location"]) {
      expect(field(container, name)).not.toBeNull();
    }
  });

  it("send no coordinates until a pin is set", () => {
    const { container } = renderForm();
    expect(field(container, "latitude")).toBeNull();
  });
});

describe("draft survives a refresh", () => {
  function fillEverything(container: HTMLElement) {
    fillStep1(container);
    fireEvent.click(field(container, "serviceIds"));
    fireEvent.click(container.querySelector('input[name="languages"][value="Telugu"]')!);
    fireEvent.change(field(container, "areasCovered"), { target: { value: "Gajuwaka" } });
    goToLastStep();
    fillStep3(container);
    fireEvent.change(field(container, "address"), { target: { value: "Door No 21-54-31, Gajuwaka" } });
    fireEvent.click(field(container, "addressIsPublic"));
  }

  it("restores every field, the pin and the step after a reload", () => {
    const first = renderForm();
    fillEverything(first.container);
    cleanup(); // the page goes away

    const { container } = renderForm(); // and comes back
    expect(field(container, "name").value).toBe("Asha Health Care");
    expect(field(container, "description").value).toMatch(/^Old age home/);
    expect((field(container, "cityId") as unknown as HTMLSelectElement).value).toBe("bc23fbfc-3788-47af-a2e5-f4ea4d0325f0");
    expect(field(container, "serviceIds").checked).toBe(true);
    expect((container.querySelector('input[name="languages"][value="Telugu"]') as HTMLInputElement).checked).toBe(true);
    expect(field(container, "areasCovered").value).toBe("Gajuwaka");
    expect(field(container, "phone").value).toBe("+91 90000 10001");
    expect(field(container, "whatsapp").value).toBe("+91 90000 10001");
    expect(field(container, "address").value).toBe("Door No 21-54-31, Gajuwaka");
    expect(field(container, "addressIsPublic").checked).toBe(true);
    expect(field(container, "location").value).toBe("17.671427, 83.203612");
    expect(field(container, "latitude").value).toBe("17.671427");
    expect(stepVisible(container, 2)).toBe(true);
  });

  it("is not shown to a different account on the same browser", () => {
    const first = renderForm();
    fillEverything(first.container);
    cleanup();
    const { container } = render(
      <ProviderRegistrationForm cities={[]} catalogue={[]} defaultEmail="other@example.org" />,
    );
    expect(field(container, "name").value).toBe("");
    expect(field(container, "email").value).toBe("other@example.org");
  });

  it("REGRESSION: a server-side rejection no longer wipes the form", async () => {
    registerProvider.mockResolvedValue({
      error: "Please check the highlighted fields.",
      fieldErrors: { phone: "Enter a valid mobile number" },
    });
    const { container } = renderForm();
    fillEverything(container);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Submit for review" })));

    expect(registerProvider).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Enter a valid mobile number")).not.toBeNull();
    expect(field(container, "name").value).toBe("Asha Health Care");
    expect(field(container, "address").value).toBe("Door No 21-54-31, Gajuwaka");
    expect(field(container, "serviceIds").checked).toBe(true);
  });
});
