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

export const STELLAR_HORIZON = config.horizon;
export const STELLAR_FRIENDBOT_URL = config.friendbot;
export const STELLAR_NETWORK = NETWORK;
