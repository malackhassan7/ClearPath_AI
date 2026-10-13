import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

describe("app entry (main.tsx)", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<div id="root"></div>';
    window.history.replaceState({}, "", "/login");
  });

  it("boots with all providers and shows the sign-in screen", async () => {
    await import("@/main");
    expect(
      await screen.findByRole("heading", { name: /sign in to dairysetu/i }),
    ).toBeInTheDocument();
  });
});
