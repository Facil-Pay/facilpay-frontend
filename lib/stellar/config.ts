/**
 * lib/stellar/config.ts
 *
 * Stellar network configuration using environment variables.
 * Supports multiple networks (testnet, public) via NEXT_PUBLIC_STELLAR_NETWORK.
 */

const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';

const NETWORKS = {
  testnet: {
    horizon: 'https://horizon-testnet.stellar.org',
    friendbot: 'https://friendbot.stellar.org',
  },
  public: {
    horizon: 'https://horizon.stellar.org',
    friendbot: null, // No Friendbot on public network
  },
} as const;

const config = NETWORKS[NETWORK as keyof typeof NETWORKS] || NETWORKS.testnet;

/**
 * Horizon REST endpoint for the configured network. Falls back to testnet when `NEXT_PUBLIC_STELLAR_NETWORK` is unrecognised.
 */
export const STELLAR_HORIZON = config.horizon;
/**
 * Friendbot faucet URL used to fund testnet accounts, or `null` on the public network where no faucet exists.
 */
export const STELLAR_FRIENDBOT_URL = config.friendbot;
/**
 * Network name read from `NEXT_PUBLIC_STELLAR_NETWORK`. Defaults to `"testnet"`.
 */
export const STELLAR_NETWORK = NETWORK;
