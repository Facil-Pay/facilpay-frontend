"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  AddressDisplay,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Skeleton,
  useToast,
} from "@/components/ui";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useWallet } from "@/components/wallet/wallet-provider";
import { useNetworkMode } from "@/lib/network-mode-context";
import { useFormat } from "@/lib/i18n/use-format";
import { STELLAR_FRIENDBOT_URL } from "@/lib/stellar";
import { fetchHorizonAccount, fundWithFriendbot, type FormattedBalance } from "@/lib/stellar/horizon";
import { StrKey } from "@/lib/stellar/strkey";
import {
  REMOVE_TRUST_LIMIT,
  buildChangeTrustXdr,
  configuredNetwork,
  describeChangeTrustError,
  isTrustlineRemovable,
  parseTrustlines,
  stellarExplorerAssetUrl,
  submitSignedChangeTrust,
  type TrustlineAsset,
} from "@/lib/stellar/trustlines";
import AddTrustlineDialog from "./AddTrustlineDialog";

const friendbotAvailable =
  configuredNetwork === "testnet" && Boolean(STELLAR_FRIENDBOT_URL);

export default function TrustlinesManager() {
  const f = useFormat();
  const toast = useToast();
  const { mode } = useNetworkMode();
  const {
    address,
    isConnected,
    isRestoring,
    isNetworkMismatch,
    isNetworkUnverified,
    signTransaction,
  } = useWallet();

  const [trustlines, setTrustlines] = useState<FormattedBalance[] | null>(null);
  const [isUnfunded, setIsUnfunded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<FormattedBalance | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  const reload = useCallback(() => setRefreshToken((token) => token + 1), []);

  useEffect(() => {
    if (!address) {
      setTrustlines(null);
      setIsUnfunded(false);
      setLoadError(null);
      return;
    }

    let active = true;
    setTrustlines(null);
    setIsUnfunded(false);
    setLoadError(null);

    void (async () => {
      const result = await fetchHorizonAccount(address);
      if (!active) return;
      if (result.error) {
        setLoadError(result.error);
        setTrustlines([]);
        return;
      }
      if (result.isUnfunded || !result.account) {
        setIsUnfunded(true);
        setTrustlines([]);
        return;
      }
      setTrustlines(parseTrustlines(result.account));
    })();

    return () => {
      active = false;
    };
  }, [address, refreshToken]);

  const trustlineList = trustlines ?? [];
  const isLoadingAccount = Boolean(address) && trustlines === null;

  const signingBlockedReason = !isConnected
    ? "Connect the wallet that controls this receiving account to add or remove trustlines."
    : isNetworkMismatch
      ? `Your wallet is connected to a different network. Switch it to ${configuredNetwork === "mainnet" ? "Mainnet" : "Testnet"} before signing.`
      : isNetworkUnverified
        ? "The wallet network could not be verified, so signing is disabled."
        : null;

  const handleAdd = useCallback(
    async (asset: TrustlineAsset) => {
      if (!address) throw new Error("Connect your wallet before adding a trustline.");
      const unsignedXdr = await buildChangeTrustXdr({ accountId: address, asset });
      const signedXdr = await signTransaction(unsignedXdr);
      return submitSignedChangeTrust(signedXdr);
    },
    [address, signTransaction],
  );

  const handleAdded = useCallback(() => {
    toast("Trustline added successfully.", "success");
    reload();
  }, [reload, toast]);

  async function handleConfirmRemove() {
    if (!address || !pendingRemoval) return;
    const target = pendingRemoval;
    const issuer = target.assetIssuer;

    if (!issuer) {
      toast(`The issuer for ${target.assetCode} is missing, so the trustline cannot be removed.`, "error");
      return;
    }

    setIsRemoving(true);
    try {
      const unsignedXdr = await buildChangeTrustXdr({
        accountId: address,
        asset: { code: target.assetCode, issuer },
        limit: REMOVE_TRUST_LIMIT,
      });
      const signedXdr = await signTransaction(unsignedXdr);
      await submitSignedChangeTrust(signedXdr);
      toast(`${target.assetCode} trustline removed.`, "success");
      setPendingRemoval(null);
      reload();
    } catch (error) {
      toast(describeChangeTrustError(error, "remove"), "error");
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleFundWithFriendbot() {
    if (!address) return;
    setIsFunding(true);
    try {
      const result = await fundWithFriendbot(address);
      toast(result.message, result.success ? "success" : "error");
      if (result.success) reload();
    } finally {
      setIsFunding(false);
    }
  }

  function renderBody() {
    if (isRestoring || isLoadingAccount) {
      return (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 rounded-md border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      );
    }

    if (!isConnected) {
      return (
        <EmptyState
          icon={<Wallet />}
          title="Connect your wallet"
          description="Trustlines belong to the merchant's receiving account. Connect the Stellar wallet that holds it to see and manage its assets."
          action={<ConnectWalletButton />}
        />
      );
    }

    if (loadError) {
      return (
        <EmptyState
          icon={<AlertTriangle />}
          title="Could not load trustlines"
          description={loadError}
          action={
            <Button
              variant="outline"
              onClick={reload}
              icon={<RefreshCw className="size-4" aria-hidden="true" />}
            >
              Try again
            </Button>
          }
        />
      );
    }

    if (isUnfunded) {
      return (
        <EmptyState
          icon={<ShieldCheck />}
          title="This account is not funded yet"
          description="Fund the receiving account with XLM before creating trustlines. Every trustline also locks 0.5 XLM of the account reserve."
          action={
            friendbotAvailable ? (
              <Button onClick={() => void handleFundWithFriendbot()} loading={isFunding}>
                Fund with Friendbot
              </Button>
            ) : undefined
          }
        />
      );
    }

    if (trustlineList.length === 0) {
      return (
        <EmptyState
          icon={<ShieldCheck />}
          title="No trustlines yet"
          description="Add a trustline so your receiving account can accept a Stellar asset such as USDC."
          action={
            <Button
              onClick={() => setAddOpen(true)}
              disabled={signingBlockedReason !== null}
              icon={<Plus className="size-4" aria-hidden="true" />}
            >
              Add trustline
            </Button>
          }
        />
      );
    }

    return (
      <ul className="divide-y divide-border">
        {trustlineList.map((trustline) => {
          const removable = isTrustlineRemovable(trustline);
          return (
            <li
              key={`${trustline.assetCode}-${trustline.assetIssuer ?? "unknown"}`}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {trustline.assetCode}
                    </span>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted">
                    <span className="shrink-0">Issuer</span>
                    <a
                      href={stellarExplorerAssetUrl(trustline)}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate font-mono text-info underline-offset-4 hover:underline"
                    >
                      {StrKey.truncateAddress(trustline.assetIssuer ?? "", 8, 8)}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:justify-end">
                <div className="text-right">
                  <span className="block text-xs text-muted">Trust limit</span>
                  <span className="text-sm font-medium text-foreground">
                    {trustline.limit
                      ? f.amount(trustline.limit, trustline.assetCode, { withCode: false })
                      : "Maximum"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-muted">Balance</span>
                  <span className="text-sm font-semibold text-foreground">
                    {f.amount(trustline.totalBalance, trustline.assetCode)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={signingBlockedReason !== null || !removable}
                    onClick={() => setPendingRemoval(trustline)}
                    icon={<Trash2 className="size-4" aria-hidden="true" />}
                  >
                    Remove
                  </Button>
                  {!removable && (
                    <span className="text-xs text-muted">
                      Balance must be zero
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Trustline Management
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Review the assets your receiving account can hold, add new ones, and remove
            the trustlines you no longer use.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={mode === "testnet" ? "warning" : "success"} dot>
            {mode === "testnet" ? "Testnet mode" : "Live mode"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={!isConnected}
            icon={<RefreshCw className="size-4" aria-hidden="true" />}
          >
            Refresh
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader
          title="Receiving account"
          subtitle={
            isConnected && address
              ? `Reading ${configuredNetwork === "mainnet" ? "Mainnet" : "Testnet"} trustlines for the connected wallet.`
              : "Connect the merchant wallet that controls your receiving account."
          }
          icon={<Wallet className="size-4" aria-hidden="true" />}
          action={
            isConnected && address ? <AddressDisplay address={address} /> : <ConnectWalletButton />
          }
        />
      </Card>

      {signingBlockedReason && isConnected && (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <p className="text-xs text-foreground">{signingBlockedReason}</p>
        </div>
      )}

      <Card>
        <CardHeader
          title="Trustlines"
          subtitle={
            isConnected
              ? `${trustlineList.length} asset${trustlineList.length === 1 ? "" : "s"} enabled on this account.`
              : "Connect a wallet to load its trustlines."
          }
          icon={<ShieldCheck className="size-4" aria-hidden="true" />}
          action={
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              disabled={signingBlockedReason !== null}
              icon={<Plus className="size-4" aria-hidden="true" />}
            >
              Add trustline
            </Button>
          }
        />
        <CardContent>{renderBody()}</CardContent>
      </Card>

      <p className="text-xs text-muted">
        Each trustline locks 0.5 XLM of your account reserve. Removing one releases that
        reserve.{" "}
        <a
          href="https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-info underline-offset-4 hover:underline"
        >
          Learn about Stellar reserves
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </p>

      {addOpen && address && (
        <AddTrustlineDialog
          existingAssets={trustlineList}
          onAdd={handleAdd}
          onAdded={handleAdded}
          onClose={() => setAddOpen(false)}
        />
      )}

      {pendingRemoval && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !isRemoving) setPendingRemoval(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove {pendingRemoval.assetCode} trustline</DialogTitle>
              <DialogDescription>
                This sends a change-trust operation with a limit of{" "}
                {REMOVE_TRUST_LIMIT}, signed by your connected wallet.
              </DialogDescription>
            </DialogHeader>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Asset</dt>
                <dd className="font-medium text-foreground">{pendingRemoval.assetCode}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Issuer</dt>
                <dd className="truncate font-mono text-xs text-foreground">
                  {StrKey.truncateAddress(pendingRemoval.assetIssuer ?? "", 8, 8)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Current balance</dt>
                <dd className="font-medium text-foreground">
                  {f.amount(pendingRemoval.totalBalance, pendingRemoval.assetCode)}
                </dd>
              </div>
            </dl>

            <p className="text-xs text-muted">
              Removing the trustline releases 0.5 XLM of your account reserve.
            </p>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPendingRemoval(null)}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={isRemoving}
                disabled={isRemoving}
                onClick={() => void handleConfirmRemove()}
              >
                Remove trustline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
