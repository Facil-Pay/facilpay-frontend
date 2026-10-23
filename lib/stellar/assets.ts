/**
 * lib/stellar/assets.ts
 *
 * Stellar asset definitions for Testnet.
 * Exported from lib/stellar/index.ts for public use.
 */

export const TESTNET_ASSETS = {
  USDC: {
    code: 'USDC',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    name: 'USD Coin (Testnet)',
    description: 'Circle USD Coin on Stellar Testnet',
    icon: '💵',
  },
  EURC: {
    code: 'EURC',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    name: 'Euro Coin (Testnet)',
    description: 'Circle Euro Coin on Stellar Testnet',
    icon: '💶',
  },
  XLM: {
    code: 'XLM',
    issuer: 'native',
    name: 'Stellar Lumens',
    description: 'Native gas & reserve asset',
    icon: '🚀',
  },
} as const;
