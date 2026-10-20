"use client";

import * as React from "react";
import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit/types";
import { useToast } from "@/components/ui";
import { loadFromStorage, saveToStorage, removeFromStorage } from "@/lib/storage";

const walletStorageKey = "facilpay.last-wallet";
const supportedWalletIds = new Set(["freighter", "xbull", "albedo", "lobstr"]);
const configuredNetworkName =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK?.toLowerCase() === "public" ||
  process.env.NEXT_PUBLIC_STELLAR_NETWORK?.toLowerCase() === "mainnet"
    ? "Public"
    : "Testnet";

function configuredNetworkPassphrase() {
  return configuredNetworkName === "Public"
    ? "Public Global Stellar Network ; September 2015"
    : "Test SDF Network ; September 2015";
}

type WalletKit = typeof import("@creit.tech/stellar-wallets-kit/sdk");
type XBullNetworkResult =
  | { network: string; networkPassphrase: string }
  | { error: true; errorMessage: string };
type XBullWalletProvider = { getNetwork: () => Promise<XBullNetworkResult> };

declare global {
  interface Window {
    xBullSDK?: XBullWalletProvider;
  }
}

type WalletContextValue = {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isRestoring: boolean;
  walletId: string | null;
  wallets: ISupportedWallet[];
  network: string | null;
  configuredNetwork: string;
  isNetworkMismatch: boolean;
  isNetworkUnverified: boolean;
  connect: (walletId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
};

const WalletContext = React.createContext<WalletContextValue | null>(null);
let kitPromise: Promise<WalletKit> | null = null;

async function readNetwork(kit: WalletKit, selectedWalletId: string) {
  try {
    const walletNetwork = await kit.StellarWalletsKit.getNetwork();
    return { name: walletNetwork.network, passphrase: walletNetwork.networkPassphrase };
  } catch {
    if (selectedWalletId === "xbull" && window.xBullSDK?.getNetwork) {
      try {
        const walletNetwork = await window.xBullSDK.getNetwork();
        if ("error" in walletNetwork) {
          return { name: "Unable to verify network", passphrase: null };
        }
        return { name: walletNetwork.network, passphrase: walletNetwork.networkPassphrase };
      } catch {
        return { name: "Unable to verify network", passphrase: null };
      }
    }
    if (selectedWalletId === "albedo") {
      return { name: `Uses app network (${configuredNetworkName})`, passphrase: configuredNetworkPassphrase() };
    }
    return { name: "Unable to verify network", passphrase: null };
  }
}

function getWalletKit(): Promise<WalletKit> {
  if (!kitPromise) {
    kitPromise = Promise.all([
      import("@creit.tech/stellar-wallets-kit/sdk"),
      import("@creit.tech/stellar-wallets-kit/types"),
      import("@creit.tech/stellar-wallets-kit/modules/freighter"),
      import("@creit.tech/stellar-wallets-kit/modules/xbull"),
      import("@creit.tech/stellar-wallets-kit/modules/albedo"),
      import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
    ])
      .then(([sdk, types, freighter, xbull, albedo, lobstr]) => {
        const network = configuredNetworkName === "Public" ? types.Networks.PUBLIC : types.Networks.TESTNET;
        sdk.StellarWalletsKit.init({
          modules: [
            new freighter.FreighterModule(),
            new xbull.xBullModule(),
            new albedo.AlbedoModule(),
            new lobstr.LobstrModule(),
          ],
          network,
        });
        return sdk;
      })
      .catch((error: unknown) => {
        kitPromise = null;
        throw error;
      });
  }
  return kitPromise;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.toLowerCase();
  if (typeof error === "string") return error.toLowerCase();
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message).toLowerCase();
  }
  return "";
}

function isUserCancellation(error: unknown) {
  return /reject|cancel|declin|denied/.test(getErrorMessage(error));
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [address, setAddress] = React.useState<string | null>(null);
  const [walletId, setWalletId] = React.useState<string | null>(null);
  const [wallets, setWallets] = React.useState<ISupportedWallet[]>([]);
  const [network, setNetwork] = React.useState<string | null>(null);
  const [walletNetworkPassphrase, setWalletNetworkPassphrase] = React.useState<string | null>(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(true);

  const isConnected = address !== null && walletId !== null;
  const isNetworkMismatch = isConnected && walletNetworkPassphrase !== null &&
    walletNetworkPassphrase !== configuredNetworkPassphrase();
  const isNetworkUnverified = isConnected && walletNetworkPassphrase === null;

  React.useEffect(() => {
    let cancelled = false;

    async function restoreWallet() {
      try {
        const kit = await getWalletKit();
        const supportedWallets = await kit.StellarWalletsKit.refreshSupportedWallets();
        if (cancelled) return;
        setWallets(supportedWallets.filter((wallet) => supportedWalletIds.has(wallet.id)));

        const storedWalletId = loadFromStorage<string | null>(walletStorageKey, null);
        if (!storedWalletId || !["freighter", "lobstr"].includes(storedWalletId)) return;
        const wallet = supportedWallets.find((item) => item.id === storedWalletId);
        if (!wallet?.isAvailable) return;

        kit.StellarWalletsKit.setWallet(storedWalletId);
        const { address: restoredAddress } = await kit.StellarWalletsKit.selectedModule.getAddress({
          skipRequestAccess: true,
        });
        if (!cancelled) {
          const walletNetwork = await readNetwork(kit, storedWalletId);
          setAddress(restoredAddress);
          setWalletId(storedWalletId);
          setNetwork(walletNetwork.name);
          setWalletNetworkPassphrase(walletNetwork.passphrase);
        }
      } catch {
        // A wallet may not be installed or authorized yet; leave the app disconnected.
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    }

    void restoreWallet();
    return () => {
      cancelled = true;
    };
  }, []);

  async function connect(selectedWalletId?: string) {
    setIsConnecting(true);
    try {
      const kit = await getWalletKit();
      let selectedAddress: string;
      let connectedWalletId = selectedWalletId;

      if (connectedWalletId) {
        if (!supportedWalletIds.has(connectedWalletId)) throw new Error("This wallet is not supported.");
        kit.StellarWalletsKit.setWallet(connectedWalletId);
        ({ address: selectedAddress } = await kit.StellarWalletsKit.fetchAddress());
      } else {
        ({ address: selectedAddress } = await kit.StellarWalletsKit.authModal());
        connectedWalletId = kit.StellarWalletsKit.selectedModule.productId;
      }

      if (!connectedWalletId) throw new Error("The selected wallet could not be identified.");
      const walletNetwork = await readNetwork(kit, connectedWalletId);
      setAddress(selectedAddress);
      setWalletId(connectedWalletId);
      setNetwork(walletNetwork.name);
      setWalletNetworkPassphrase(walletNetwork.passphrase);
      saveToStorage(walletStorageKey, connectedWalletId);
    } catch (error) {
      toast(
        isUserCancellation(error)
          ? "Wallet connection was cancelled."
          : "Could not connect to that wallet. Check that it is installed and try again.",
        "error",
      );
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }

  async function disconnect() {
    try {
      const kit = await getWalletKit();
      await kit.StellarWalletsKit.disconnect();
    } finally {
      removeFromStorage(walletStorageKey);
      setAddress(null);
      setWalletId(null);
      setNetwork(null);
      setWalletNetworkPassphrase(null);
    }
  }

  async function signTransaction(xdr: string) {
    if (!address || !walletId) throw new Error("Connect a wallet before signing a transaction.");
    const kit = await getWalletKit();
    const currentNetwork = await readNetwork(kit, walletId);
    setNetwork(currentNetwork.name);
    setWalletNetworkPassphrase(currentNetwork.passphrase);

    if (currentNetwork.passphrase && currentNetwork.passphrase !== configuredNetworkPassphrase()) {
      const message = `Your wallet is on ${currentNetwork.name}. Switch it to ${configuredNetworkName} before signing.`;
      toast(message, "error");
      throw new Error(message);
    }
    if (!currentNetwork.passphrase) {
      const message = "The wallet network could not be verified. Signing is disabled until the network can be checked.";
      toast(message, "error");
      throw new Error(message);
    }

    try {
      const result = await kit.StellarWalletsKit.signTransaction(xdr, {
        address,
        networkPassphrase: configuredNetworkPassphrase(),
      });
      return result.signedTxXdr;
    } catch (error) {
      toast(
        isUserCancellation(error)
          ? "Signature request was cancelled or rejected. No transaction was signed."
          : "Could not sign the transaction. Check your wallet and try again.",
        "error",
      );
      throw error;
    }
  }

  React.useEffect(() => {
    if (!isConnected || !walletId || !["freighter", "lobstr"].includes(walletId)) return;
    let cancelled = false;

    async function refreshNetwork() {
      try {
        const kit = await getWalletKit();
        const currentNetwork = await readNetwork(kit, walletId!);
        if (!cancelled) {
          setNetwork(currentNetwork.name);
          setWalletNetworkPassphrase(currentNetwork.passphrase);
        }
      } catch {
        if (!cancelled) setWalletNetworkPassphrase(null);
      }
    }

    window.addEventListener("focus", refreshNetwork);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshNetwork);
    };
  }, [isConnected, walletId]);

  const value: WalletContextValue = {
    address,
    isConnected,
    isConnecting,
    isRestoring,
    walletId,
    wallets,
    network,
    configuredNetwork: configuredNetworkName,
    isNetworkMismatch,
    isNetworkUnverified,
    connect,
    disconnect,
    signTransaction,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = React.useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
}