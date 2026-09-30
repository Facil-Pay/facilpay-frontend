"use client";

import { useState, type FormEvent } from "react";
import { Can, usePermission } from "@/components/auth/Can";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/permissions";
import { teamActions, useTeam } from "@/lib/team";

const INVITABLE = ROLES.filter((r) => r !== "owner");
const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");

export default function TeamPage() {
  const { members, currentUserId } = useTeam();
  const canManage = usePermission("team:manage");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [lastLink, setLastLink] = useState<string | null>(null);

  const onInvite = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    const m = teamActions.invite(email, role);
    setLastLink(`${window.location.origin}/invite/${m.inviteToken}`);
    setEmail("");
  };

  return (
    <div className="space-y-6">
      <Can permission="team:manage">
        <form onSubmit={onInvite} className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <label className="flex min-w-56 flex-1 flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">Invite by email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" className="rounded-md border border-zinc-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-md border border-zinc-300 px-3 py-2">
              {INVITABLE.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-md bg-[#000F24] px-4 py-2 text-sm font-medium text-white">Send invite</button>
          {lastLink && <p className="w-full break-all text-xs text-zinc-500">Invite link (mock email): <a className="text-[#20a7ee] underline" href={lastLink}>{lastLink}</a></p>}
        </form>
      </Can>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last active</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">{m.name || m.email}{m.id === currentUserId && <span className="ml-2 text-xs text-zinc-400">(you)</span>}</p>
                  <p className="max-w-64 truncate text-xs text-zinc-500">{m.email ?? m.wallet}</p>
                </td>
                <td className="px-4 py-3">
                  {canManage && m.role !== "owner" ? (
                    <select aria-label={`Role for ${m.email ?? m.name}`} value={m.role} onChange={(e) => teamActions.changeRole(m.id, e.target.value as Role)} className="rounded-md border border-zinc-300 px-2 py-1">
                      {INVITABLE.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  ) : ROLE_LABELS[m.role]}
                </td>
                <td className="px-4 py-3">
                  <span className={m.status === "active" ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700" : "rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"}>{m.status}</span>
                </td>
                <td className="px-4 py-3 text-zinc-500">{m.status === "invited" ? `Invited ${fmt(m.invitedAt)}` : fmt(m.lastActive)}</td>
                <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                  {m.status === "invited" && (
                    <Can permission="team:manage" mode="disable">
                      <button type="button" onClick={() => teamActions.resend(m.id)} className="text-[#20a7ee] disabled:opacity-40">Resend</button>
                    </Can>
                  )}
                  {m.role !== "owner" && (
                    <Can permission="team:manage" mode="disable">
                      <button type="button" onClick={() => teamActions.remove(m.id)} className="text-red-600 disabled:opacity-40">{m.status === "invited" ? "Cancel" : "Remove"}</button>
                    </Can>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <label className="flex items-center gap-2 text-xs text-zinc-500">
        Preview as (demo):
        <select value={currentUserId} onChange={(e) => teamActions.switchUser(e.target.value)} className="rounded border border-zinc-300 px-2 py-1">
          {members.filter((m) => m.status === "active").map((m) => <option key={m.id} value={m.id}>{m.name} — {ROLE_LABELS[m.role]}</option>)}
        </select>
      </label>
    </div>
  );
}
