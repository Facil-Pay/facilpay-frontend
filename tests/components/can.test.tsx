/**
 * tests/components/can.test.tsx
 *
 * Tests for the Can permission-gate component and the usePermission hook.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Can } from "@/components/auth/Can";
import type { TeamMember } from "@/lib/team";

// Stub useCurrentMember so we can control the active role without a real store
vi.mock("@/lib/team", () => ({
  useCurrentMember: vi.fn(),
}));

import { useCurrentMember } from "@/lib/team";

function setRole(role: TeamMember["role"] | null) {
  vi.mocked(useCurrentMember).mockReturnValue(
    role
      ? ({
          id: "m1",
          email: "test@example.com",
          name: "Tester",
          role,
          status: "active",
        } as TeamMember)
      : null,
  );
}

describe("Can", () => {
  it("renders children when the role has the required permission", () => {
    setRole("owner");
    render(
      <Can permission="team:manage">
        <span>Manage team</span>
      </Can>,
    );
    expect(screen.getByText("Manage team")).toBeInTheDocument();
  });

  it("hides children when the role lacks the required permission (mode=hide)", () => {
    setRole("viewer");
    render(
      <Can permission="team:manage">
        <span>Manage team</span>
      </Can>,
    );
    expect(screen.queryByText("Manage team")).not.toBeInTheDocument();
  });

  it("renders fallback when provided and permission is denied", () => {
    setRole("developer");
    render(
      <Can permission="team:manage" fallback={<span>No access</span>}>
        <span>Manage team</span>
      </Can>,
    );
    expect(screen.queryByText("Manage team")).not.toBeInTheDocument();
    expect(screen.getByText("No access")).toBeInTheDocument();
  });

  it("disables the child element in disable mode when permission is denied", () => {
    setRole("viewer");
    render(
      <Can permission="team:manage" mode="disable">
        <button>Manage</button>
      </Can>,
    );
    expect(screen.getByRole("button", { name: "Manage" })).toBeDisabled();
  });
});
