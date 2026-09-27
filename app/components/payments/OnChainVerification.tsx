import type { OnChainData } from "@/app/lib/types/payment";
import { Card, CardHeader, CardDivider, DetailRow } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { CopyButton } from "./CopyButton";

// ─── Icons ────────────────────────────────────────────────────────────────────

function ShieldCheckIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.497v1.517c0 5.206-3.603 9.548-8.5 10.986C4.388 16.548.785 12.206.785 7V5.483a.5.5 0 01.48-.497 11.947 11.947 0 007.078-2.749h.318zM13.22 8.72a.75.75 0 00-1.06-1.06l-2.91 2.91-1.12-1.12a.75.75 0 00-1.06 1.06l1.65 1.65a.75.75 0 001.06 0l3.44-3.44z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
        clipRule="evenodd"
      />
      <path
        fillRule="evenodd"
        d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ─── Confirmation progress bar ────────────────────────────────────────────────

function ConfirmationBar({
  confirmations,
  required,
}: {
  confirmations: number;
  required: number;
}) {
  const pct = Math.min((confirmations / Math.max(required, 1)) * 100, 100);
  const isConfirmed = confirmations >= required;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">Confirmations</span>
        <span
          className={`font-semibold tabular-nums ${
            isConfirmed ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          {confirmations} / {required} required
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isConfirmed ? "bg-emerald-500" : "bg-amber-400"
          }`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={confirmations}
          aria-valuemin={0}
          aria-valuemax={required}
        />
      </div>
      {isConfirmed && (
        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
          <span aria-hidden="true">✓</span> Transaction fully confirmed on-chain
        </p>
      )}
    </div>
  );
}

// ─── Hash display with copy (uses client CopyButton island) ──────────────────

function HashDisplay({ label, hash }: { label: string; hash: string }) {
  const short = `${hash.slice(0, 10)}…${hash.slice(-8)}`;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <div className="flex items-center gap-2 rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2">
        <code
          className="flex-1 text-xs font-mono text-zinc-800 truncate"
          title={hash}
        >
          {short}
        </code>
        {/* CopyButton is a client component — isolated interactive island */}
        <CopyButton text={hash} label={label} />
      </div>
    </div>
  );
}

// ─── Network labels ───────────────────────────────────────────────────────────

const networkLabels: Record<string, string> = {
  stellar:  "Stellar",
  ethereum: "Ethereum",
  bitcoin:  "Bitcoin",
  solana:   "Solana",
};

// ─── Main component ───────────────────────────────────────────────────────────

interface OnChainVerificationProps {
  data: OnChainData;
}

export function OnChainVerification({ data }: OnChainVerificationProps) {
  const isConfirmed = data.confirmations >= data.requiredConfirmations;

  return (
    <Card>
      <CardHeader
        icon={<ShieldCheckIcon />}
        title="On-Chain Verification"
        subtitle={`Verified on the ${networkLabels[data.network] ?? data.network} network`}
        action={
          <Badge variant={isConfirmed ? "success" : "warning"} size="sm" dot>
            {isConfirmed ? "Verified" : "Pending"}
          </Badge>
        }
      />

      <CardDivider className="my-4" />

      {/* Confirmation progress */}
      <div className="mb-5">
        <ConfirmationBar
          confirmations={data.confirmations}
          required={data.requiredConfirmations}
        />
      </div>

      {/* Transaction hashes */}
      <div className="grid grid-cols-1 gap-3 mb-5">
        <HashDisplay label="Transaction Hash" hash={data.txHash} />
        {data.blockHash && (
          <HashDisplay label="Block Hash" hash={data.blockHash} />
        )}
      </div>

      {/* Numeric details */}
      <dl className="space-y-3">
        {data.blockNumber != null && (
          <DetailRow
            label="Block / Ledger"
            value={`#${data.blockNumber.toLocaleString()}`}
          />
        )}
        {data.ledgerSequence != null && data.blockNumber == null && (
          <DetailRow
            label="Ledger Sequence"
            value={`#${data.ledgerSequence.toLocaleString()}`}
          />
        )}
        <DetailRow label="Network Fee" value={`${data.fee} ${data.feeAsset}`} />
        <DetailRow label="From Address" value={data.fromAddress} mono />
        <DetailRow label="To Address"   value={data.toAddress}   mono />
        {data.memoText && (
          <DetailRow
            label="Memo"
            value={<code className="font-mono text-xs">{data.memoText}</code>}
          />
        )}
        {data.broadcastAt && (
          <DetailRow
            label="Broadcast At"
            value={new Date(data.broadcastAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "medium",
            })}
          />
        )}
        {data.confirmedAt && (
          <DetailRow
            label="Confirmed At"
            value={new Date(data.confirmedAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "medium",
            })}
          />
        )}
      </dl>

      {/* Explorer link */}
      <div className="mt-5 pt-4 border-t border-zinc-100">
        <a
          href={data.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0077B6] hover:text-[#55C2FF] transition-colors"
        >
          View on {networkLabels[data.network] ?? data.network} Explorer
          <ExternalLinkIcon />
        </a>
      </div>
    </Card>
  );
}

// ─── No on-chain data placeholder ─────────────────────────────────────────────

export function OnChainPending() {
  return (
    <Card>
      <CardHeader
        icon={<ShieldCheckIcon />}
        title="On-Chain Verification"
        subtitle="Waiting for transaction to be broadcast"
        action={
          <Badge variant="warning" size="sm" dot>
            Pending
          </Badge>
        }
      />
      <CardDivider className="my-4" />
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
          <svg
            className="h-6 w-6 text-amber-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-700">No on-chain data yet</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            This payment has not been broadcast to the network.
          </p>
        </div>
      </div>
    </Card>
  );
}
