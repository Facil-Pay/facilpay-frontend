"use client";

import { createLocalStore } from "./local-store";
import type { Role } from "./permissions";

export type MemberStatus = "active" | "invited";

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  wallet?: string;
  role: Role;
  status: MemberStatus;
  lastActive?: string;
  inviteToken?: string;
  invitedAt?: string;
}

interface TeamState {
  members: TeamMember[];
  currentUserId: string;
}

const INITIAL: TeamState = {
  currentUserId: "u_owner",
  members: [
    { id: "u_owner", name: "Merchant Owner", email: "owner@facilpay.io", wallet: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF", role: "owner", status: "active", lastActive: new Date().toISOString() },
    { id: "u_dev", name: "Dana Dev", email: "dana@facilpay.io", role: "developer", status: "active", lastActive: "2026-09-28T14:10:00Z" },
    { id: "u_inv", name: "", email: "sam@facilpay.io", role: "support", status: "invited", inviteToken: "demo-invite", invitedAt: "2026-09-29T09:00:00Z" },
  ],
};

export const teamStore = createLocalStore<TeamState>("facilpay_team", INITIAL);

const uid = () => Math.random().toString(36).slice(2, 10);

export function useTeam() {
  return teamStore.useStore();
}

export function useCurrentMember(): TeamMember | undefined {
  const { members, currentUserId } = useTeam();
  return members.find((m) => m.id === currentUserId);
}

export const teamActions = {
  invite(email: string, role: Role) {
    if (role === "owner") throw new Error("Cannot invite another owner");
    const member: TeamMember = { id: uid(), name: "", email, role, status: "invited", inviteToken: uid() + uid(), invitedAt: new Date().toISOString() };
    teamStore.set((s) => ({ ...s, members: [...s.members, member] }));
    return member;
  },
  resend(id: string) {
    teamStore.set((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, invitedAt: new Date().toISOString() } : m)) }));
  },
  changeRole(id: string, role: Role) {
    teamStore.set((s) => ({ ...s, members: s.members.map((m) => (m.id === id && m.role !== "owner" && role !== "owner" ? { ...m, role } : m)) }));
  },
  remove(id: string) {
    teamStore.set((s) => ({ ...s, members: s.members.filter((m) => m.id !== id || m.role === "owner") }));
  },
  findInvite(token: string) {
    return teamStore.get().members.find((m) => m.status === "invited" && m.inviteToken === token);
  },
  acceptInvite(token: string, name: string, wallet: string) {
    const invite = teamActions.findInvite(token);
    if (!invite) return null;
    teamStore.set((s) => ({
      currentUserId: invite.id,
      members: s.members.map((m) =>
        m.id === invite.id ? { ...m, name: name || m.email || "Member", wallet, status: "active", inviteToken: undefined, lastActive: new Date().toISOString() } : m,
      ),
    }));
    return invite;
  },
  /** Demo helper: act as another member to preview their permissions. */
  switchUser(id: string) {
    teamStore.set((s) => ({ ...s, currentUserId: id }));
  },
};
