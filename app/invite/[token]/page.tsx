"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/permissions";
import { teamActions, useTeam, type TeamMember } from "@/lib/team";

async function connectWallet(): Promise<string | null> {
  try {
    const freighter = await import("@stellar/freighter-api");
    const res = await freighter.requestAccess();
    if ("address" in res && res.address) return res.address;
  } catch {
    /* fall through to mock */
  }
  return "G" + Array.from({ length: 55 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[Math.floor(Math.random() * 32)]).join("");
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  useTeam(); // re-render once local storage hydrates
  const [invite, setInvite] = useState<TeamMember | undefined>();
  const [name, setName] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setInvite(teamActions.findInvite(token)), [token]);

  if (!invite) {
    return <Shell><h1 className="text-xl font-semibold">Invitation not found</h1><p className="mt-2 text-sm text-zinc-500">This invite link is invalid, cancelled or already used.</p></Shell>;
  }

  return (
    <Shell>
      <h1 className="text-xl font-semibold text-zinc-900">Join the team</h1>
      <p className="mt-1 text-sm text-zinc-500">{invite.email} was invited as <strong>{ROLE_LABELS[invite.role]}</strong>.</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-6 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
      {wallet ? (
        <p className="mt-3 break-all rounded-md bg-zinc-50 p-2 font-mono text-xs text-zinc-600">{wallet}</p>
      ) : (
        <button type="button" disabled={busy} onClick={async () => { setBusy(true); setWallet(await connectWallet()); setBusy(false); }} className="mt-3 w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium">
          {busy ? "Connecting…" : "Connect wallet"}
        </button>
      )}
      <button type="button" disabled={!wallet} onClick={() => { teamActions.acceptInvite(token, name, wallet!); router.push("/overview"); }} className="mt-3 w-full rounded-md bg-[#000F24] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
        Accept & join
      </button>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6"><div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">{children}</div></main>;
}
