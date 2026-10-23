"use client";

import { Laptop, Loader2, LogOut, MapPin, Smartphone, Wallet } from "lucide-react";
import { TwoFactorSection } from "@/components/security/TwoFactorSection";
import { useToast } from "@/components/ui/toast";
import { useLinkedWallets, useRevokeOtherSessions, useRevokeSession, useSessions } from "@/lib/api/hooks/useSettings";
import { endLocalSession } from "@/lib/auth-context";
import { useFormat } from "@/lib/i18n/use-format";
import type { MerchantSession } from "@/lib/types/settings";
import { SettingsError, SettingsLoading, SettingsSection } from "./form-fields";

function isMobile(session: MerchantSession) {
  return /iphone|android|ipad|mobile/i.test(session.device);
}

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <TwoFactorSection />
      <SessionsSection />
      <LinkedWalletsSection />
    </div>
  );
}

function SessionsSection() {
  const toast = useToast();
  const f = useFormat();
  const { data: sessions, isLoading, isError, error, refetch } = useSessions();
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const otherCount = sessions?.filter((session) => !session.current).length ?? 0;

  const handleRevoke = async (session: MerchantSession) => {
    if (session.current && !window.confirm("Sign out of this device? You'll need to log in again.")) return;
    try {
      await revoke.mutateAsync(session.id);
      if (session.current) {
        // The server has already invalidated this token; drop local state and leave.
        endLocalSession();
        return;
      }
      toast(`Signed out of ${session.device}`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not revoke session", "error");
    }
  };

  const handleRevokeOthers = async () => {
    if (!window.confirm("Sign out of all other sessions? Those devices will need to log in again.")) return;
    try {
      await revokeOthers.mutateAsync();
      toast("Signed out of all other sessions", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not revoke sessions", "error");
    }
  };

  if (isLoading) return <SettingsLoading />;
  if (isError || !sessions) return <SettingsError message={error?.message ?? "Unknown error"} onRetry={() => void refetch()} />;

  // Current device first, then most recently active.
  const ordered = [...sessions].sort(
    (a, b) => Number(b.current) - Number(a.current) || Date.parse(b.lastActiveAt) - Date.parse(a.lastActiveAt),
  );

  return (
    <SettingsSection
      title="Active sessions"
      description="Devices currently signed in to your FacilPay account. We email you and send an in-app alert when a new device signs in."
    >
      <ul className="divide-y divide-zinc-100">
        {ordered.map((session) => {
          const Icon = isMobile(session) ? Smartphone : Laptop;
          const revoking = revoke.isPending && revoke.variables === session.id;
          return (
            <li key={session.id} className="flex flex-wrap items-center gap-3 py-3">
              <Icon className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900">
                  {session.device}
                  {session.browser && <span className="font-normal text-zinc-500"> · {session.browser}</span>}
                  {session.current && (
                    <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">This device</span>
                  )}
                </p>
                <p className="flex flex-wrap items-center gap-x-1 text-xs text-zinc-500">
                  {session.location && (
                    <span className="inline-flex items-center gap-0.5" title="Approximate location based on IP address">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {session.location}
                    </span>
                  )}
                  {session.location && <span aria-hidden="true">·</span>}
                  <span className="font-mono">{session.ipAddress}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {session.current ? (
                      "Active now"
                    ) : (
                      <>
                        Last active{" "}
                        <time dateTime={session.lastActiveAt} title={f.dateTime(session.lastActiveAt)}>
                          {f.relative(session.lastActiveAt)}
                        </time>
                      </>
                    )}
                  </span>
                </p>
                <p className="text-[11px] text-zinc-400">Signed in {f.dateTime(session.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleRevoke(session)}
                disabled={revoking}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
              >
                {revoking && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
                {session.current ? "Sign out" : "Revoke"}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 border-t border-zinc-100 pt-4">
        <button
          type="button"
          onClick={() => void handleRevokeOthers()}
          disabled={otherCount === 0 || revokeOthers.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {revokeOthers.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
          Sign out of all other sessions
        </button>
      </div>
    </SettingsSection>
  );
}

function LinkedWalletsSection() {
  const f = useFormat();
  const { data: wallets, isLoading, isError, error, refetch } = useLinkedWallets();

  if (isLoading) return <SettingsLoading />;
  if (isError || !wallets) return <SettingsError message={error?.message ?? "Unknown error"} onRetry={() => void refetch()} />;

  return (
    <SettingsSection title="Linked wallets" description="Stellar wallets connected to this merchant account.">
      {wallets.length === 0 ? (
        <p className="text-sm text-zinc-500">No wallets linked yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {wallets.map((wallet) => (
            <li key={wallet.address} className="flex flex-wrap items-center gap-3 py-3">
              <Wallet className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900">
                  {wallet.label ?? "Wallet"}
                  {wallet.provider && <span className="font-normal capitalize text-zinc-500"> · {wallet.provider}</span>}
                  {wallet.isSettlement && (
                    <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">Settlement</span>
                  )}
                </p>
                <p className="break-all font-mono text-xs text-zinc-500">{wallet.address}</p>
              </div>
              <span className="text-xs text-zinc-400">Linked {f.date(wallet.linkedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </SettingsSection>
  );
}
