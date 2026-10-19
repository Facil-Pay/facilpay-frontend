/**
 * Stellar Horizon API Client and Account Balances Service.
 * Reads live account balances, subentries, trustlines, and recent operations directly from Horizon.
 */

export interface HorizonBalanceNative {
  asset_type: 'native';
  balance: string;
  buying_liabilities?: string;
  selling_liabilities?: string;
}

export interface HorizonBalanceCredit {
  asset_type: 'credit_alphanum4' | 'credit_alphanum12';
  asset_code: string;
  asset_issuer: string;
  balance: string;
  limit?: string;
  buying_liabilities?: string;
  selling_liabilities?: string;
}

export type HorizonBalance = HorizonBalanceNative | HorizonBalanceCredit;

export interface HorizonSigner {
  key: string;
  weight: number;
  type: string;
  sponsor?: string;
}

export interface HorizonThresholds {
  low_threshold: number;
  med_threshold: number;
  high_threshold: number;
}

export interface HorizonAccountResponse {
  id: string;
  sequence: string;
  subentry_count: number;
  balances: HorizonBalance[];
  thresholds?: HorizonThresholds;
  signers?: HorizonSigner[];
}

export interface XlmReserveCalculation {
  total: number;
  minReserve: number;
  available: number;
  baseReserve: number;
  subentryCount: number;
  sellingLiabilities: number;
  formulaExplanation: string;
}

export interface FormattedBalance {
  assetCode: string;
  assetIssuer?: string;
  isNative: boolean;
  totalBalance: number;
  availableBalance: number;
  limit?: string;
  subentryCount?: number;
  reserveDetails?: XlmReserveCalculation;
  stellarExpertUrl: string;
}

export interface HorizonOperation {
  id: string;
  type: string;
  typeLabel: string;
  createdAt: string;
  transactionHash: string;
  stellarExpertUrl: string;
  details: {
    amount?: string;
    assetCode?: string;
    assetIssuer?: string;
    from?: string;
    to?: string;
    funder?: string;
    startingBalance?: string;
    trustor?: string;
    limit?: string;
  };
}

export interface SupportedAssetOption {
  code: string;
  name: string;
  issuer: string;
  domain: string;
  iconName: string;
}

export const HORIZON_TESTNET_URL =
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';

export const STELLAR_BASE_RESERVE = 0.5; // Protocol 20+ base reserve per subentry

// Canonical Circle & Anchor Testnet/Public Issuers
export const SUPPORTED_TRUSTLINE_ASSETS: SupportedAssetOption[] = [
  {
    code: 'USDC',
    name: 'USD Coin (Circle)',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    domain: 'circle.com',
    iconName: 'usdc',
  },
  {
    code: 'EURC',
    name: 'Euro Coin (Circle)',
    issuer: 'GAYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    domain: 'circle.com',
    iconName: 'eurc',
  },
  {
    code: 'AQUA',
    name: 'Aquarius Liquidity',
    issuer: 'GBNZILSTVQZ4RWOF9LCWYDPOICGCKAZ67QPF6LWK7P7MDEVSCWR7DPUW',
    domain: 'aqua.network',
    iconName: 'aqua',
  },
];

/**
 * Calculates the exact spendable XLM balance accounting for the minimum reserve.
 * Formula: Minimum Reserve = (2 base reserve + subentry_count) * 0.5 XLM + selling_liabilities.
 */
export function calculateXlmReserve(
  totalXlm: number,
  subentryCount = 0,
  sellingLiabilities = 0
): XlmReserveCalculation {
  // Base accounts require 2 base reserves (1 for account entry + 1 for base transaction reserve)
  const baseReservesCount = 2;
  const totalSubentries = baseReservesCount + subentryCount;
  const minReserve = Number((totalSubentries * STELLAR_BASE_RESERVE + sellingLiabilities).toFixed(7));
  const available = Math.max(0, Number((totalXlm - minReserve).toFixed(7)));

  const formulaExplanation = `Base Reserve: 2 × ${STELLAR_BASE_RESERVE} XLM + ${subentryCount} subentries (${subentryCount} × ${STELLAR_BASE_RESERVE} XLM) = ${minReserve} XLM required by Stellar protocol.`;

  return {
    total: totalXlm,
    minReserve,
    available,
    baseReserve: STELLAR_BASE_RESERVE,
    subentryCount,
    sellingLiabilities,
    formulaExplanation,
  };
}

/**
 * Loads account balances directly from Horizon API.
 * Returns null if account is 404 (Unfunded).
 */
export async function fetchHorizonAccount(
  accountId: string,
  horizonUrl = HORIZON_TESTNET_URL
): Promise<{ account: HorizonAccountResponse | null; isUnfunded: boolean; error?: string }> {
  try {
    const res = await fetch(`${horizonUrl}/accounts/${accountId}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.status === 404) {
      return { account: null, isUnfunded: true };
    }

    if (!res.ok) {
      return { account: null, isUnfunded: false, error: `Horizon error: ${res.statusText}` };
    }

    const data: HorizonAccountResponse = await res.json();
    return { account: data, isUnfunded: false };
  } catch (err: any) {
    return { account: null, isUnfunded: false, error: err?.message || 'Network error' };
  }
}

/**
 * Requests testnet funding from Stellar Friendbot for an unfunded account.
 */
export async function fundWithFriendbot(
  accountId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(accountId)}`);
    if (res.ok) {
      return {
        success: true,
        message: 'Account successfully funded with 10,000 testnet XLM via Friendbot!',
      };
    }
    const err = await res.json();
    return {
      success: false,
      message: err.detail || 'Friendbot funding request failed. Try again in a few moments.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error contacting Friendbot.',
    };
  }
}

/**
 * Parses Horizon account balances into structured format with reserve calculation.
 */
export function parseHorizonBalances(
  account: HorizonAccountResponse
): FormattedBalance[] {
  const subentryCount = account.subentry_count || 0;
  const results: FormattedBalance[] = [];

  for (const b of account.balances) {
    if (b.asset_type === 'native') {
      const total = parseFloat(b.balance);
      const sellingLiabilities = parseFloat(b.selling_liabilities || '0');
      const reserve = calculateXlmReserve(total, subentryCount, sellingLiabilities);

      results.push({
        assetCode: 'XLM',
        isNative: true,
        totalBalance: total,
        availableBalance: reserve.available,
        subentryCount,
        reserveDetails: reserve,
        stellarExpertUrl: 'https://stellar.expert/explorer/testnet/asset/XLM',
      });
    } else {
      const total = parseFloat(b.balance);
      results.push({
        assetCode: b.asset_code,
        assetIssuer: b.asset_issuer,
        isNative: false,
        totalBalance: total,
        availableBalance: total,
        limit: b.limit,
        stellarExpertUrl: `https://stellar.expert/explorer/testnet/asset/${b.asset_code}-${b.asset_issuer}`,
      });
    }
  }

  // Ensure XLM is always first
  return results.sort((a, b) => (a.isNative ? -1 : b.isNative ? 1 : 0));
}

/**
 * Loads recent account operations from Horizon.
 */
export async function fetchAccountOperations(
  accountId: string,
  limit = 10,
  horizonUrl = HORIZON_TESTNET_URL
): Promise<HorizonOperation[]> {
  try {
    const res = await fetch(
      `${horizonUrl}/accounts/${accountId}/operations?order=desc&limit=${limit}`,
      { headers: { Accept: 'application/json' } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const records = data._embedded?.records || [];

    return records.map((op: any): HorizonOperation => {
      let typeLabel = op.type.replace(/_/g, ' ');
      typeLabel = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);

      return {
        id: op.id,
        type: op.type,
        typeLabel,
        createdAt: op.created_at,
        transactionHash: op.transaction_hash,
        stellarExpertUrl: `https://stellar.expert/explorer/testnet/tx/${op.transaction_hash}`,
        details: {
          amount: op.amount,
          assetCode: op.asset_code || (op.asset_type === 'native' ? 'XLM' : undefined),
          assetIssuer: op.asset_issuer,
          from: op.from,
          to: op.to,
          funder: op.funder,
          startingBalance: op.starting_balance,
          trustor: op.trustor,
          limit: op.limit,
        },
      };
    });
  } catch {
    return [];
  }
}
