// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const reviewProvider = vi.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();
vi.mock("@/app/admin/actions", () => ({ reviewProvider: (...a: unknown[]) => reviewProvider(...a) }));

const { AdminReviewActions } = await import("@/components/admin-review-actions");

beforeEach(() => {
  reviewProvider.mockReset();
  reviewProvider.mockResolvedValue({ done: "Approved — the listing is now live in search." });
});
afterEach(cleanup);

const buttons = () => screen.queryAllByRole("button").map((b) => b.textContent);

it.each([
  ["pending", ["Approve", "Reject"]],
  ["approved", ["Suspend"]],
  ["rejected", ["Approve", "Back to pending"]],
  ["suspended", ["Restore", "Reject"]],
] as const)("%s listings offer %j", (status, expected) => {
  render(<AdminReviewActions providerId="p1" status={status} />);
  expect(buttons()).toEqual(expected);
});

it("approves after confirmation and shows the result", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<AdminReviewActions providerId="p1" status="pending" />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Called owner" } });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Approve" })));
  const data = reviewProvider.mock.calls[0][1] as FormData;
  expect([data.get("providerId"), data.get("decision"), data.get("notes")]).toEqual(["p1", "approved", "Called owner"]);
  expect(screen.getByRole("status").textContent).toMatch(/live in search/);
});

it("does nothing when the confirmation is cancelled", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<AdminReviewActions providerId="p1" status="pending" />);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Approve" })));
  expect(reviewProvider).not.toHaveBeenCalled();
});

it("shows a server error", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  reviewProvider.mockResolvedValue({ error: "That listing no longer exists." });
  render(<AdminReviewActions providerId="p1" status="pending" />);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Reject" })));
  expect(screen.getByRole("alert").textContent).toBe("That listing no longer exists.");
});
