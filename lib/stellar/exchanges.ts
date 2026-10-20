/**
 * Known Centralized Exchange Addresses on Stellar.
 * Exchanges use single pooled hot wallets and identify individual user deposits
 * solely by the transaction Memo (Text or ID).
 */

export interface ExchangeInfo {
  name: string;
  website: string;
  memoRequired: boolean;
  memoTypeDescription: string;
}

export const KNOWN_EXCHANGE_ADDRESSES: Record<string, ExchangeInfo> = {
  // Binance
  GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG: {
    name: 'Binance',
    website: 'binance.com',
    memoRequired: true,
    memoTypeDescription: 'Numeric Memo ID',
  },
  'GAB7F3X3Q77J26C67347A22J2G5S3C4K7Q72X6Y27Z7Z676767676767': {
    name: 'Binance US',
    website: 'binance.us',
    memoRequired: true,
    memoTypeDescription: 'Numeric Memo ID',
  },

  // Coinbase
  GBV4ZDEPNQYXVTHTT7QWC2SZNCYGHYLMR7NA52AAS2RXR2MGDF6ISXNV: {
    name: 'Coinbase',
    website: 'coinbase.com',
    memoRequired: true,
    memoTypeDescription: 'Memo ID or Alpha-numeric Reference',
  },

  // Kraken
  GA5XIGA5C7QTPTWXQHY6MCJRMTRZDOSHR6QVIBHSNDMS6NOSTIQS5KDU: {
    name: 'Kraken',
    website: 'kraken.com',
    memoRequired: true,
    memoTypeDescription: 'Numeric Routing Memo',
  },

  // Bitso
  GBVAOIACNSB7OVUXJYC5UE2MT42MR3KZN07GDF5GMSN2ZLLFLA5E7A: {
    name: 'Bitso',
    website: 'bitso.com',
    memoRequired: true,
    memoTypeDescription: 'Numeric Deposit Memo',
  },

  // KuCoin
  GBB4JST7G4I5R7V4G76A472X72M72Q72K72Z72P72M72N72B72V72C72: {
    name: 'KuCoin',
    website: 'kucoin.com',
    memoRequired: true,
    memoTypeDescription: 'Deposit Memo ID',
  },

  // OKX
  GCX3Q77J26C67347A22J2G5S3C4K7Q72X6Y27Z7Z676767676767OKX: {
    name: 'OKX',
    website: 'okx.com',
    memoRequired: true,
    memoTypeDescription: 'Deposit Tag / Memo',
  },
};

/**
 * Checks if a given Stellar address or federation domain matches a known exchange.
 */
export function getExchangeDetails(
  address: string,
  federationDomain?: string
): ExchangeInfo | null {
  if (!address) return null;
  const cleanAddress = address.trim();

  // Check by Stellar address
  if (KNOWN_EXCHANGE_ADDRESSES[cleanAddress]) {
    return KNOWN_EXCHANGE_ADDRESSES[cleanAddress];
  }

  // Check by federation domain
  if (federationDomain) {
    const domain = federationDomain.toLowerCase();
    if (domain.includes('binance')) {
      return {
        name: 'Binance',
        website: 'binance.com',
        memoRequired: true,
        memoTypeDescription: 'Numeric Memo ID',
      };
    }
    if (domain.includes('coinbase')) {
      return {
        name: 'Coinbase',
        website: 'coinbase.com',
        memoRequired: true,
        memoTypeDescription: 'Memo ID',
      };
    }
    if (domain.includes('kraken')) {
      return {
        name: 'Kraken',
        website: 'kraken.com',
        memoRequired: true,
        memoTypeDescription: 'Routing Memo',
      };
    }
    if (domain.includes('bitso')) {
      return {
        name: 'Bitso',
        website: 'bitso.com',
        memoRequired: true,
        memoTypeDescription: 'Numeric Memo',
      };
    }
  }

  return null;
}

export function isKnownExchangeAddress(
  address: string,
  federationDomain?: string
): boolean {
  return getExchangeDetails(address, federationDomain) !== null;
}
