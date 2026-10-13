import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { App } from "@/app/App";
import { renderApp } from "./utils";

beforeEach(() => localStorage.clear());

describe("DairySetu-TN shell", () => {
  it("renders the sign-in screen and role selector", () => {
    renderApp(<App />, "/login");
    expect(
      screen.getByRole("heading", { name: /sign in to dairysetu/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in to platform/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /fssai officer/i }),
    ).toBeInTheDocument();
  });
});
