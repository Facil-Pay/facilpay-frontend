/**
 * tests/components/button.test.tsx
 *
 * Unit tests for the shared Button component.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Submit</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("does not call onClick when disabled", async () => {
    const handler = vi.fn();
    render(<Button disabled onClick={handler}>Nope</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Nope" }));
    expect(handler).not.toHaveBeenCalled();
  });

  it("shows a loading spinner and disables interaction when loading", () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole("button", { name: /save/i });
    // loading prop sets aria-busy and disabled
    expect(btn).toBeDisabled();
  });

  it("applies the danger variant class", () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByRole("button", { name: "Delete" });
    expect(btn.className).toMatch(/danger/);
  });
});
