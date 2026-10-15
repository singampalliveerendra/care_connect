// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { expect, it } from "vitest";

import { ForgetRegistrationDraft } from "@/components/forget-registration-draft";
import { DRAFT_KEY } from "@/lib/registration-draft";

it("drops the saved draft once the listing exists", () => {
  localStorage.setItem(DRAFT_KEY, "{}");
  render(<ForgetRegistrationDraft />);
  expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
});
