import { describe, it, expect, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import { App } from "@/app/App";
import { renderApp } from "./utils";

describe("registration form", () => {
  beforeEach(() => localStorage.clear());

  it("offers only self-service roles; officer and admin are not selectable", async () => {
    renderApp(<App />, "/register");
    const select = await screen.findByLabelText(/^role$/i);
    const values = within(select).getAllByRole("option").map((o) => (o as HTMLOptionElement).value);
    expect(values).toEqual(["user", "consultant"]);
    expect(values).not.toContain("farmer");
    expect(values).not.toContain("entrepreneur");
    expect(values).not.toContain("admin");
    expect(values).not.toContain("officer");
    expect(screen.getByText(/created by an administrator/i)).toBeInTheDocument();
  });
});
