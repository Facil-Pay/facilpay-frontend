import type {
  Payment,
  PaymentStatus,
  PaginatedPayments,
  PaymentFilter,
  PaymentSortField,
  PaymentSortOrder,
} from "@/app/lib/types/payment";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PAYMENTS: Payment[] = [
  // ── 1 ──────────────────────────────────────────────────────────────────────
  {
    id: "pay_01j9xk2m3n4p5q6r7s8t9u0v",
    reference: "FP-2026-00247",
    status: "completed",
    method: "crypto",
    network: "stellar",
    amount: 1250.0,
    currency: "USDC",
    amountUsd: 1250.0,
    sender: {
      name: "Acme Corp",
      accountId: "acc_sender_001",
      walletAddress: "GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6",
      email: "payments@acmecorp.com",
    },
    recipient: {
      name: "TechVentures Ltd",
      accountId: "acc_recipient_007",
      walletAddress: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGKEVEFQ3NJ6SZ2WI2ZPFC",
      email: "finance@techventures.io",
    },
    description: "Q3 2026 Software Licensing Fee",
    notes: "Includes support package renewal for 12 months.",
    tags: ["invoice", "recurring", "q3-2026"],
    createdAt: "2026-09-24T09:15:00Z",
    updatedAt: "2026-09-24T09:18:43Z",
    completedAt: "2026-09-24T09:18:43Z",
    onChain: {
      network: "stellar",
      txHash: "a5c2e8f1b4d7e3a9c6b2d5f8e1a4c7b3e6f9a2d5c8b1e4a7d0f3c6e9b2a5d8",
      blockNumber: 52841920,
      blockHash: "0000000000000000000a3f2e1d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1",
      confirmations: 12,
      requiredConfirmations: 1,
      ledgerSequence: 52841920,
      fee: 0.00001,
      feeAsset: "XLM",
      fromAddress: "GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6",
      toAddress: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGKEVEFQ3NJ6SZ2WI2ZPFC",
      memoText: "FP-2026-00247",
      explorerUrl: "https://stellar.expert/explorer/public/tx/a5c2e8f1b4d7e3a9c6b2d5f8e1a4c7b3e6f9a2d5c8b1e4a7d0f3c6e9b2a5d8",
      broadcastAt: "2026-09-24T09:16:05Z",
      confirmedAt: "2026-09-24T09:18:43Z",
    },
    events: [
      { id: "evt_001", type: "created",   status: "pending",    title: "Payment Created",       description: "Payment request initiated by Acme Corp merchant portal.",                         timestamp: "2026-09-24T09:15:00Z", actor: "Acme Corp (merchant portal)" },
      { id: "evt_002", type: "processing",status: "processing", title: "Processing Started",    description: "Payment validated and queued for on-chain broadcast to Stellar network.",         timestamp: "2026-09-24T09:15:52Z", actor: "FacilPay Engine" },
      { id: "evt_003", type: "broadcast", status: "processing", title: "Transaction Broadcast", description: "Transaction submitted to the Stellar network. Awaiting ledger confirmation.",     timestamp: "2026-09-24T09:16:05Z", actor: "FacilPay Engine", metadata: { txHash: "a5c2e8f1b4d7e3a9c6b2d5f8e1a4c7b3e6f9a2d5c8b1e4a7d0f3c6e9b2a5d8", ledger: 52841920 } },
      { id: "evt_004", type: "confirmed", status: "processing", title: "On-Chain Confirmed",    description: "Transaction included in ledger #52841920 with 1 confirmation.",                  timestamp: "2026-09-24T09:17:30Z", actor: "Stellar Network", metadata: { confirmations: 1, ledger: 52841920 } },
      { id: "evt_005", type: "completed", status: "completed",  title: "Payment Completed",     description: "Funds successfully settled. Recipient balance updated. 12 confirmations reached.", timestamp: "2026-09-24T09:18:43Z", actor: "FacilPay Engine", metadata: { confirmations: 12 } },
    ],
    canRefund: true,
    canCancel: false,
    canRetry: false,
  },
  // ── 2 ──────────────────────────────────────────────────────────────────────
  {
    id: "pay_02k0yl3n4o5p6q7r8s9t0u1w",
    reference: "FP-2026-00248",
    status: "processing",
    method: "crypto",
    network: "stellar",
    amount: 500.0,
    currency: "USDC",
    amountUsd: 500.0,
    sender: {
      name: "GlobalShop Inc.",
      accountId: "acc_sender_002",
      walletAddress: "GBVFFWM4GHPQK5TFMXXHM5LGKXD7DEXBBIQH3AYQLM2LFUQGTCEBVTW",
      email: "ops@globalshop.com",
    },
    recipient: {
      name: "Nexus Suppliers",
      accountId: "acc_recipient_003",
      walletAddress: "GDOEVDDBU6OBWKL7VHDAOKD77UP4DVSSK2VGA6KQVPXSQMTD5KTKJSS",
      email: "accounts@nexus.supply",
    },
    description: "Inventory restock payment — Batch #B2026-112",
    tags: ["inventory", "b2b"],
    createdAt: "2026-09-26T07:30:00Z",
    updatedAt: "2026-09-26T07:32:10Z",
    onChain: {
      network: "stellar",
      txHash: "b6d3f9a2c5e8b1d4f7a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5d8f1a4c7e0b3",
      confirmations: 0,
      requiredConfirmations: 1,
      ledgerSequence: 52845100,
      fee: 0.00001,
      feeAsset: "XLM",
      fromAddress: "GBVFFWM4GHPQK5TFMXXHM5LGKXD7DEXBBIQH3AYQLM2LFUQGTCEBVTW",
      toAddress: "GDOEVDDBU6OBWKL7VHDAOKD77UP4DVSSK2VGA6KQVPXSQMTD5KTKJSS",
      memoText: "FP-2026-00248",
      explorerUrl: "https://stellar.expert/explorer/public/tx/b6d3f9a2c5e8b1d4f7a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5d8f1a4c7e0b3",
      broadcastAt: "2026-09-26T07:32:10Z",
    },
    events: [
      { id: "evt_101", type: "created",    status: "pending",    title: "Payment Created",       description: "Payment request submitted via API integration.", timestamp: "2026-09-26T07:30:00Z", actor: "GlobalShop Inc. (API)" },
      { id: "evt_102", type: "processing", status: "processing", title: "Processing Started",    description: "Payment validated and queued for broadcast.",     timestamp: "2026-09-26T07:31:00Z", actor: "FacilPay Engine" },
      { id: "evt_103", type: "broadcast",  status: "processing", title: "Transaction Broadcast", description: "Transaction submitted to the Stellar network. Awaiting confirmation.", timestamp: "2026-09-26T07:32:10Z", actor: "FacilPay Engine", metadata: { txHash: "b6d3f9a2c5e8b1d4f7a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5d8f1a4c7e0b3" } },
    ],
    canRefund: false,
    canCancel: true,
    canRetry: false,
  },
  // ── 3 ──────────────────────────────────────────────────────────────────────
  {
    id: "pay_03l1zm4o5p6q7r8s9t0u1v2x",
    reference: "FP-2026-00243",
    status: "failed",
    method: "crypto",
    network: "stellar",
    amount: 3200.0,
    currency: "USDC",
    amountUsd: 3200.0,
    sender: {
      name: "Bright Ideas Studio",
      accountId: "acc_sender_005",
      walletAddress: "GCITNIY4AKJLCTVQV7GZNVJFV3HUQ4LF5OL5VBKPZ7F5XJKNQ4TEWOX",
      email: "billing@brightideas.design",
    },
    recipient: {
      name: "CloudInfra Services",
      accountId: "acc_recipient_009",
      walletAddress: "GDMXNQBJMS3FYI4PJTZQFHBKN5PINOQ5AOMKWZVFM2GEJBQOVKIGZZR",
    },
    description: "Annual cloud infrastructure contract",
    tags: ["infrastructure", "annual"],
    createdAt: "2026-09-22T14:00:00Z",
    updatedAt: "2026-09-22T14:05:31Z",
    events: [
      { id: "evt_201", type: "created",    status: "pending",    title: "Payment Created",    description: "Payment request submitted by merchant.", timestamp: "2026-09-22T14:00:00Z", actor: "Bright Ideas Studio" },
      { id: "evt_202", type: "processing", status: "processing", title: "Processing Started", description: "Payment queued for broadcast.",           timestamp: "2026-09-22T14:01:10Z", actor: "FacilPay Engine" },
      { id: "evt_203", type: "failed",     status: "failed",     title: "Transaction Failed", description: "Stellar network rejected the transaction: insufficient XLM balance for fee reserve.", timestamp: "2026-09-22T14:05:31Z", actor: "Stellar Network", metadata: { errorCode: "op_underfunded", ledger: 52835600 } },
    ],
    canRefund: false,
    canCancel: false,
    canRetry: true,
  },
  // ── 4 ──────────────────────────────────────────────────────────────────────
  {
    id: "pay_04m2an5p6q7r8s9t0u1v2w3y",
    reference: "FP-2026-00240",
    status: "refunded",
    method: "crypto",
    network: "stellar",
    amount: 875.5,
    currency: "USDC",
    amountUsd: 875.5,
    sender: {
      name: "RetailEdge POS",
      accountId: "acc_sender_008",
      walletAddress: "GCZPUE3OHJLKTVPKMZMHSOTX7QFJBSUQ6KVHB6RIYP4KQJC3NG5SXOP",
      email: "store@retailedge.com",
    },
    recipient: {
      name: "Omega Wholesale",
      accountId: "acc_recipient_011",
      walletAddress: "GBSAREGMXPHMTQZJXPUYQXMJHXMQT3AFYJB7BXYNMVR3D4A5LKQPZTR",
    },
    description: "Wholesale order #ORD-9921",
    tags: ["wholesale", "pos"],
    createdAt: "2026-09-20T11:00:00Z",
    updatedAt: "2026-09-21T09:45:00Z",
    completedAt: "2026-09-20T11:08:22Z",
    onChain: {
      network: "stellar",
      txHash: "c7e4a1d8b5f2c9e6a3d0f7b4e1c8a5d2f9b6e3a0d7c4b1f8e5a2d9c6b3f0e7",
      confirmations: 120,
      requiredConfirmations: 1,
      ledgerSequence: 52830100,
      fee: 0.00001,
      feeAsset: "XLM",
      fromAddress: "GCZPUE3OHJLKTVPKMZMHSOTX7QFJBSUQ6KVHB6RIYP4KQJC3NG5SXOP",
      toAddress: "GBSAREGMXPHMTQZJXPUYQXMJHXMQT3AFYJB7BXYNMVR3D4A5LKQPZTR",
      memoText: "FP-2026-00240",
      explorerUrl: "https://stellar.expert/explorer/public/tx/c7e4a1d8b5f2c9e6a3d0f7b4e1c8a5d2f9b6e3a0d7c4b1f8e5a2d9c6b3f0e7",
      broadcastAt: "2026-09-20T11:02:14Z",
      confirmedAt: "2026-09-20T11:08:22Z",
    },
    events: [
      { id: "evt_301", type: "created",         status: "pending",    title: "Payment Created",      description: "Payment initiated from POS terminal.",                                          timestamp: "2026-09-20T11:00:00Z", actor: "RetailEdge POS" },
      { id: "evt_302", type: "processing",      status: "processing", title: "Processing Started",   description: "Payment queued and validated.",                                                 timestamp: "2026-09-20T11:01:00Z", actor: "FacilPay Engine" },
      { id: "evt_303", type: "broadcast",       status: "processing", title: "Transaction Broadcast",description: "Transaction submitted to Stellar network.",                                     timestamp: "2026-09-20T11:02:14Z", actor: "FacilPay Engine" },
      { id: "evt_304", type: "completed",       status: "completed",  title: "Payment Completed",    description: "Funds settled to Omega Wholesale.",                                            timestamp: "2026-09-20T11:08:22Z", actor: "FacilPay Engine" },
      { id: "evt_305", type: "refund_initiated",status: "refunded",   title: "Refund Initiated",     description: "Merchant initiated refund. Reason: Customer dispute resolved in buyer's favour.", timestamp: "2026-09-21T09:30:00Z", actor: "RetailEdge POS (admin)" },
      { id: "evt_306", type: "refunded",        status: "refunded",   title: "Refund Completed",     description: "Full refund of 875.50 USDC returned to sender wallet.",                        timestamp: "2026-09-21T09:45:00Z", actor: "FacilPay Engine" },
    ],
    canRefund: false,
    canCancel: false,
    canRetry: false,
  },
  // ── 5 ──────────────────────────────────────────────────────────────────────
  {
    id: "pay_05n3bo6q7r8s9t0u1v2w3x4z",
    reference: "FP-2026-00250",
    status: "pending",
    method: "crypto",
    network: "stellar",
    amount: 150.0,
    currency: "USDC",
    amountUsd: 150.0,
    sender: {
      name: "DevHub Agency",
      accountId: "acc_sender_012",
      walletAddress: "GCFZKLBBMZQ5RXJBV4XFDLJEFOXMBYY5VPZ5D4KZYWVLZB3XQHSTBK2",
      email: "payments@devhub.io",
    },
    recipient: {
      name: "Freelancer: Maria Santos",
      accountId: "acc_recipient_015",
      walletAddress: "GDWCFAVIZYQ3AQPQCX4BGAJXICDSQZQPBFR3Y7DZPQ4S2WPQMLSNNMJ",
      email: "maria@freelance.io",
    },
    description: "Logo design — Project #P-0091",
    tags: ["freelance", "design"],
    createdAt: "2026-09-26T11:00:00Z",
    updatedAt: "2026-09-26T11:00:00Z",
    expiresAt: "2026-09-27T11:00:00Z",
    events: [
      { id: "evt_401", type: "created", status: "pending", title: "Payment Created", description: "Payment request created. Awaiting sender confirmation.", timestamp: "2026-09-26T11:00:00Z", actor: "DevHub Agency" },
    ],
    canRefund: false,
    canCancel: true,
    canRetry: false,
  },
  // ── 6 ──────────────────────────────────────────────────────────────────────
  {
    id: "pay_06o4cp7r8s9t0u1v2w3x4y5a",
    reference: "FP-2026-00231",
    status: "completed",
    method: "crypto",
    network: "ethereum",
    amount: 8400.0,
    currency: "USDT",
    amountUsd: 8400.0,
    sender: {
      name: "Meridian Capital",
      accountId: "acc_sender_020",
      walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      email: "treasury@meridian.capital",
    },
    recipient: {
      name: "Apex Analytics",
      accountId: "acc_recipient_022",
      walletAddress: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
      email: "billing@apexanalytics.com",
    },
    description: "Data platform annual subscription renewal",
    tags: ["saas", "annual", "enterprise"],
    createdAt: "2026-09-15T13:00:00Z",
    updatedAt: "2026-09-15T13:12:05Z",
    completedAt: "2026-09-15T13:12:05Z",
    onChain: {
      network: "ethereum",
      txHash: "0xd4e8a2f1b9c3e5d7a1f4b6e8c2d5f9a3b7e1d4f8a2c6b9e3d7f1a5c8b2e6d9",
      blockNumber: 20481234,
      confirmations: 45,
      requiredConfirmations: 12,
      fee: 0.0021,
      feeAsset: "ETH",
      fromAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      toAddress: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
      explorerUrl: "https://etherscan.io/tx/0xd4e8a2f1b9c3e5d7a1f4b6e8c2d5f9a3b7e1d4f8a2c6b9e3d7f1a5c8b2e6d9",
      broadcastAt: "2026-09-15T13:03:00Z",
      confirmedAt: "2026-09-15T13:12:05Z",
    },
    events: [
      { id: "evt_501", type: "created",   status: "pending",    title: "Payment Created",       description: "Enterprise payment initiated.",                      timestamp: "2026-09-15T13:00:00Z", actor: "Meridian Capital" },
      { id: "evt_502", type: "broadcast", status: "processing", title: "Transaction Broadcast", description: "Transaction submitted to Ethereum mainnet.",           timestamp: "2026-09-15T13:03:00Z", actor: "FacilPay Engine" },
      { id: "evt_503", type: "confirmed", status: "processing", title: "On-Chain Confirmed",    description: "12 confirmations reached on Ethereum.",               timestamp: "2026-09-15T13:10:00Z", actor: "Ethereum Network" },
      { id: "evt_504", type: "completed", status: "completed",  title: "Payment Completed",     description: "Funds settled with 45 confirmations.",                timestamp: "2026-09-15T13:12:05Z", actor: "FacilPay Engine" },
    ],
    canRefund: true,
    canCancel: false,
    canRetry: false,
  },
  // ── 7 ──────────────────────────────────────────────────────────────────────
  {
    id: "pay_07p5dq8s9t0u1v2w3x4y5z6b",
    reference: "FP-2026-00219",
    status: "completed",
    method: "crypto",
    network: "solana",
    amount: 320.0,
    currency: "USDC",
    amountUsd: 320.0,
    sender: {
      name: "Pixel Forge Studios",
      accountId: "acc_sender_030",
      walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      email: "finance@pixelforge.io",
    },
    recipient: {
      name: "Sound Labs",
      accountId: "acc_recipient_031",
      walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWW",
    },
    description: "Audio assets licensing — Pack #A44",
    tags: ["creative", "licensing"],
    createdAt: "2026-09-10T08:45:00Z",
    updatedAt: "2026-09-10T08:46:30Z",
    completedAt: "2026-09-10T08:46:30Z",
    onChain: {
      network: "solana",
      txHash: "3yxK8mVqZ7nP2wT1fR4sB6dL9cE5hA0gJ7iU2oY3kN8vM1pW6qF4tX5yZ9nB2",
      blockNumber: 285920100,
      confirmations: 200,
      requiredConfirmations: 32,
      fee: 0.000005,
      feeAsset: "SOL",
      fromAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      toAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWW",
      explorerUrl: "https://solscan.io/tx/3yxK8mVqZ7nP2wT1fR4sB6dL9cE5hA0gJ7iU2oY3kN8vM1pW6qF4tX5yZ9nB2",
      broadcastAt: "2026-09-10T08:45:10Z",
      confirmedAt: "2026-09-10T08:46:30Z",
    },
    events: [
      { id: "evt_601", type: "created",   status: "pending",   title: "Payment Created",       description: "Payment created via Solana integration.", timestamp: "2026-09-10T08:45:00Z", actor: "Pixel Forge Studios" },
      { id: "evt_602", type: "broadcast", status: "processing",title: "Transaction Broadcast", description: "Submitted to Solana network.",             timestamp: "2026-09-10T08:45:10Z", actor: "FacilPay Engine" },
      { id: "evt_603", type: "completed", status: "completed", title: "Payment Completed",     description: "Confirmed with 200 slots.",                timestamp: "2026-09-10T08:46:30Z", actor: "FacilPay Engine" },
    ],
    canRefund: true,
    canCancel: false,
    canRetry: false,
  },
  // ── 8 ──────────────────────────────────────────────────────────────────────
  {
    id: "pay_08q6er9t0u1v2w3x4y5z6a7c",
    reference: "FP-2026-00205",
    status: "failed",
    method: "crypto",
    network: "ethereum",
    amount: 15750.0,
    currency: "USDT",
    amountUsd: 15750.0,
    sender: {
      name: "Atlas Trading Co.",
      accountId: "acc_sender_040",
      walletAddress: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
      email: "accounts@atlastrading.com",
    },
    recipient: {
      name: "Iron Gate Logistics",
      accountId: "acc_recipient_041",
      walletAddress: "0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c",
    },
    description: "Q3 logistics contract payment",
    tags: ["logistics", "contract"],
    createdAt: "2026-09-05T16:20:00Z",
    updatedAt: "2026-09-05T16:22:18Z",
    events: [
      { id: "evt_701", type: "created",    status: "pending",    title: "Payment Created",    description: "Large contract payment initiated.",                                                             timestamp: "2026-09-05T16:20:00Z", actor: "Atlas Trading Co." },
      { id: "evt_702", type: "processing", status: "processing", title: "Processing Started", description: "Payment validated.",                                                                            timestamp: "2026-09-05T16:20:45Z", actor: "FacilPay Engine" },
      { id: "evt_703", type: "failed",     status: "failed",     title: "Transaction Failed", description: "Ethereum transaction reverted: gas limit exceeded. Please retry with a higher gas allowance.", timestamp: "2026-09-05T16:22:18Z", actor: "Ethereum Network", metadata: { errorCode: "out_of_gas", block: 20451200 } },
    ],
    canRefund: false,
    canCancel: false,
    canRetry: true,
  },
  // ── 9 ──────────────────────────────────────────────────────────────────────
  {
    id: "pay_09r7fs0u1v2w3x4y5z6a7b8d",
    reference: "FP-2026-00198",
    status: "cancelled",
    method: "crypto",
    network: "stellar",
    amount: 60.0,
    currency: "USDC",
    amountUsd: 60.0,
    sender: {
      name: "StartupHive",
      accountId: "acc_sender_050",
      email: "finance@startuphive.co",
    },
    recipient: {
      name: "CoWork Spaces",
      accountId: "acc_recipient_051",
    },
    description: "Monthly hot-desk subscription",
    tags: ["subscription", "monthly"],
    createdAt: "2026-09-01T09:00:00Z",
    updatedAt: "2026-09-01T09:05:00Z",
    events: [
      { id: "evt_801", type: "created",   status: "pending",   title: "Payment Created",   description: "Subscription payment created.",                timestamp: "2026-09-01T09:00:00Z", actor: "StartupHive" },
      { id: "evt_802", type: "cancelled", status: "cancelled", title: "Payment Cancelled", description: "Cancelled by merchant before broadcast.", timestamp: "2026-09-01T09:05:00Z", actor: "StartupHive (admin)" },
    ],
    canRefund: false,
    canCancel: false,
    canRetry: false,
  },
  // ── 10 ─────────────────────────────────────────────────────────────────────
  {
    id: "pay_10s8gt1v2w3x4y5z6a7b8c9e",
    reference: "FP-2026-00187",
    status: "completed",
    method: "crypto",
    network: "bitcoin",
    amount: 0.035,
    currency: "BTC",
    amountUsd: 2240.0,
    sender: {
      name: "Nomad Investments",
      accountId: "acc_sender_060",
      walletAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      email: "ops@nomadinvestments.io",
    },
    recipient: {
      name: "Vault Asset Management",
      accountId: "acc_recipient_061",
      walletAddress: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    },
    description: "BTC settlement — invoice INV-2026-044",
    tags: ["bitcoin", "settlement"],
    createdAt: "2026-08-28T10:00:00Z",
    updatedAt: "2026-08-28T11:05:30Z",
    completedAt: "2026-08-28T11:05:30Z",
    onChain: {
      network: "bitcoin",
      txHash: "f4e2d9a1c7b5e3f8a2d4c6b8e0f2a4c6b8e0d2f4a6c8b0e2d4f6a8c0b2e4d6",
      blockNumber: 855120,
      confirmations: 6,
      requiredConfirmations: 6,
      fee: 0.000015,
      feeAsset: "BTC",
      fromAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      toAddress: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
      explorerUrl: "https://mempool.space/tx/f4e2d9a1c7b5e3f8a2d4c6b8e0f2a4c6b8e0d2f4a6c8b0e2d4f6a8c0b2e4d6",
      broadcastAt: "2026-08-28T10:05:00Z",
      confirmedAt: "2026-08-28T11:05:30Z",
    },
    events: [
      { id: "evt_901", type: "created",   status: "pending",    title: "Payment Created",       description: "BTC payment initiated.",                  timestamp: "2026-08-28T10:00:00Z", actor: "Nomad Investments" },
      { id: "evt_902", type: "broadcast", status: "processing", title: "Transaction Broadcast", description: "Submitted to Bitcoin mempool.",            timestamp: "2026-08-28T10:05:00Z", actor: "FacilPay Engine" },
      { id: "evt_903", type: "confirmed", status: "processing", title: "Confirmations Reached", description: "6 of 6 required confirmations completed.", timestamp: "2026-08-28T11:00:00Z", actor: "Bitcoin Network" },
      { id: "evt_904", type: "completed", status: "completed",  title: "Payment Completed",     description: "Settlement confirmed.",                   timestamp: "2026-08-28T11:05:30Z", actor: "FacilPay Engine" },
    ],
    canRefund: false,
    canCancel: false,
    canRetry: false,
  },
  // ── 11 ─────────────────────────────────────────────────────────────────────
  {
    id: "pay_11t9hu2w3x4y5z6a7b8c9d0f",
    reference: "FP-2026-00175",
    status: "refunded",
    method: "crypto",
    network: "solana",
    amount: 489.99,
    currency: "USDC",
    amountUsd: 489.99,
    sender: {
      name: "NeonCart",
      accountId: "acc_sender_070",
      walletAddress: "DRpbCBMxVnDK7mVtSLkZyAWLGBXoVKMKEgS4fUGvRrF",
      email: "hello@neoncart.shop",
    },
    recipient: {
      name: "ZenDesk Plugins",
      accountId: "acc_recipient_071",
      walletAddress: "So11111111111111111111111111111111111111112",
    },
    description: "Plugin marketplace purchase — Order #ZD-5582",
    tags: ["marketplace", "plugins"],
    createdAt: "2026-08-20T15:30:00Z",
    updatedAt: "2026-08-21T10:00:00Z",
    completedAt: "2026-08-20T15:32:00Z",
    onChain: {
      network: "solana",
      txHash: "5kJ2mNpQrT8vW1xY3zA6bC9dE0fG7hI4jK2lM8nO5pR1sT6uV3wX9yZ0aB4cD",
      blockNumber: 284100200,
      confirmations: 512,
      requiredConfirmations: 32,
      fee: 0.000005,
      feeAsset: "SOL",
      fromAddress: "DRpbCBMxVnDK7mVtSLkZyAWLGBXoVKMKEgS4fUGvRrF",
      toAddress: "So11111111111111111111111111111111111111112",
      explorerUrl: "https://solscan.io/tx/5kJ2mNpQrT8vW1xY3zA6bC9dE0fG7hI4jK2lM8nO5pR1sT6uV3wX9yZ0aB4cD",
      broadcastAt: "2026-08-20T15:30:20Z",
      confirmedAt: "2026-08-20T15:32:00Z",
    },
    events: [
      { id: "evt_1001", type: "created",         status: "pending",   title: "Payment Created",   description: "Purchase completed at marketplace.",                   timestamp: "2026-08-20T15:30:00Z", actor: "NeonCart" },
      { id: "evt_1002", type: "completed",       status: "completed", title: "Payment Completed", description: "Payment settled on Solana.",                           timestamp: "2026-08-20T15:32:00Z", actor: "FacilPay Engine" },
      { id: "evt_1003", type: "refund_initiated",status: "refunded",  title: "Refund Initiated",  description: "Plugin incompatible; refund requested by customer.",    timestamp: "2026-08-21T09:00:00Z", actor: "NeonCart (support)" },
      { id: "evt_1004", type: "refunded",        status: "refunded",  title: "Refund Completed",  description: "489.99 USDC returned to NeonCart wallet.",              timestamp: "2026-08-21T10:00:00Z", actor: "FacilPay Engine" },
    ],
    canRefund: false,
    canCancel: false,
    canRetry: false,
  },
  // ── 12 ─────────────────────────────────────────────────────────────────────
  {
    id: "pay_12u0iv3x4y5z6a7b8c9d0e1g",
    reference: "FP-2026-00162",
    status: "completed",
    method: "crypto",
    network: "stellar",
    amount: 5500.0,
    currency: "USDC",
    amountUsd: 5500.0,
    sender: {
      name: "BluePrint Construction",
      accountId: "acc_sender_080",
      walletAddress: "GBHWKBPP6O45XNDLWCRTUZ7JGKXY2HBQPHPQXQ47XYEJAKN5VPXQY5K",
      email: "finance@blueprintco.build",
    },
    recipient: {
      name: "SteelForge Supplies",
      accountId: "acc_recipient_081",
      walletAddress: "GCWBJH27ONJF4XATYY7VHQUGJT7ORVX7YZZB4NQIXUGIKBH6VCNM5Z",
    },
    description: "Materials delivery — Project Horizon Phase 2",
    tags: ["construction", "materials", "b2b"],
    createdAt: "2026-08-12T07:00:00Z",
    updatedAt: "2026-08-12T07:09:45Z",
    completedAt: "2026-08-12T07:09:45Z",
    onChain: {
      network: "stellar",
      txHash: "e9b3f7a2d1c8e5b4f2a9d6c3b7e4a1f8d5c2b9e6a3d0f7c4b1e8a5d2c9b6e3",
      blockNumber: 52701000,
      confirmations: 88,
      requiredConfirmations: 1,
      fee: 0.00001,
      feeAsset: "XLM",
      fromAddress: "GBHWKBPP6O45XNDLWCRTUZ7JGKXY2HBQPHPQXQ47XYEJAKN5VPXQY5K",
      toAddress: "GCWBJH27ONJF4XATYY7VHQUGJT7ORVX7YZZB4NQIXUGIKBH6VCNM5Z",
      memoText: "FP-2026-00162",
      explorerUrl: "https://stellar.expert/explorer/public/tx/e9b3f7a2d1c8e5b4f2a9d6c3b7e4a1f8d5c2b9e6a3d0f7c4b1e8a5d2c9b6e3",
      broadcastAt: "2026-08-12T07:02:00Z",
      confirmedAt: "2026-08-12T07:09:45Z",
    },
    events: [
      { id: "evt_1101", type: "created",   status: "pending",    title: "Payment Created",       description: "Large materials payment initiated.", timestamp: "2026-08-12T07:00:00Z", actor: "BluePrint Construction" },
      { id: "evt_1102", type: "broadcast", status: "processing", title: "Transaction Broadcast", description: "Submitted to Stellar.",               timestamp: "2026-08-12T07:02:00Z", actor: "FacilPay Engine" },
      { id: "evt_1103", type: "completed", status: "completed",  title: "Payment Completed",     description: "Settled with 88 confirmations.",      timestamp: "2026-08-12T07:09:45Z", actor: "FacilPay Engine" },
    ],
    canRefund: true,
    canCancel: false,
    canRetry: false,
  },
  // ── 13 ─────────────────────────────────────────────────────────────────────
  {
    id: "pay_13v1jw4y5z6a7b8c9d0e1f2h",
    reference: "FP-2026-00150",
    status: "pending",
    method: "crypto",
    network: "ethereum",
    amount: 2100.0,
    currency: "USDT",
    amountUsd: 2100.0,
    sender: {
      name: "ClearPath Legal",
      accountId: "acc_sender_090",
      walletAddress: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
      email: "billing@clearpath.legal",
    },
    recipient: {
      name: "Court Filing Services",
      accountId: "acc_recipient_091",
      walletAddress: "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
    },
    description: "Filing fee — Case #CF-2026-8821",
    tags: ["legal", "filing"],
    createdAt: "2026-07-30T11:20:00Z",
    updatedAt: "2026-07-30T11:20:00Z",
    expiresAt: "2026-08-06T11:20:00Z",
    events: [
      { id: "evt_1201", type: "created", status: "pending", title: "Payment Created", description: "Legal filing payment awaiting authorisation.", timestamp: "2026-07-30T11:20:00Z", actor: "ClearPath Legal" },
    ],
    canRefund: false,
    canCancel: true,
    canRetry: false,
  },
  // ── 14 ─────────────────────────────────────────────────────────────────────
  {
    id: "pay_14w2kx5z6a7b8c9d0e1f2g3i",
    reference: "FP-2026-00139",
    status: "completed",
    method: "crypto",
    network: "stellar",
    amount: 980.0,
    currency: "USDC",
    amountUsd: 980.0,
    sender: {
      name: "Vela Marketing",
      accountId: "acc_sender_100",
      walletAddress: "GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP",
      email: "ops@velamarketing.agency",
    },
    recipient: {
      name: "Print & Bind Co.",
      accountId: "acc_recipient_101",
      walletAddress: "GBVL5ZVWBXTWN6MM62UFTKM4KPKN5DLBOATB7HPFX3MEWZZ55OG5KTH",
    },
    description: "Campaign print run — Jul 2026",
    tags: ["marketing", "print"],
    createdAt: "2026-07-18T09:10:00Z",
    updatedAt: "2026-07-18T09:18:20Z",
    completedAt: "2026-07-18T09:18:20Z",
    onChain: {
      network: "stellar",
      txHash: "d0f8e6c4a2b0d8e6c4a2b0d8e6c4a2b0d8e6c4a2b0d8e6c4a2b0d8e6c4a2b0",
      blockNumber: 52500100,
      confirmations: 200,
      requiredConfirmations: 1,
      fee: 0.00001,
      feeAsset: "XLM",
      fromAddress: "GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP",
      toAddress: "GBVL5ZVWBXTWN6MM62UFTKM4KPKN5DLBOATB7HPFX3MEWZZ55OG5KTH",
      memoText: "FP-2026-00139",
      explorerUrl: "https://stellar.expert/explorer/public/tx/d0f8e6c4a2b0d8e6c4a2b0d8e6c4a2b0d8e6c4a2b0d8e6c4a2b0d8e6c4a2b0",
      broadcastAt: "2026-07-18T09:12:00Z",
      confirmedAt: "2026-07-18T09:18:20Z",
    },
    events: [
      { id: "evt_1301", type: "created",   status: "pending",    title: "Payment Created",       description: "Marketing campaign payment.", timestamp: "2026-07-18T09:10:00Z", actor: "Vela Marketing" },
      { id: "evt_1302", type: "broadcast", status: "processing", title: "Transaction Broadcast", description: "Submitted to Stellar.",        timestamp: "2026-07-18T09:12:00Z", actor: "FacilPay Engine" },
      { id: "evt_1303", type: "completed", status: "completed",  title: "Payment Completed",     description: "Settled successfully.",        timestamp: "2026-07-18T09:18:20Z", actor: "FacilPay Engine" },
    ],
    canRefund: true,
    canCancel: false,
    canRetry: false,
  },
  // ── 15 ─────────────────────────────────────────────────────────────────────
  {
    id: "pay_15x3ly6a7b8c9d0e1f2g3h4j",
    reference: "FP-2026-00128",
    status: "failed",
    method: "crypto",
    network: "solana",
    amount: 720.0,
    currency: "USDC",
    amountUsd: 720.0,
    sender: {
      name: "Orbit Gaming",
      accountId: "acc_sender_110",
      walletAddress: "AxVT98x4BMPJ9KUFfLzj4AynB3CxNu5tB5UMRiKm2pVV",
      email: "payments@orbitgaming.gg",
    },
    recipient: {
      name: "ProServer Hosting",
      accountId: "acc_recipient_111",
      walletAddress: "6eSvuaX4bnV6gn4L2AK3FgVmWbCY5aGw8RjKhN7mPQT",
    },
    description: "Game server hosting — August 2026",
    tags: ["gaming", "hosting"],
    createdAt: "2026-07-05T14:00:00Z",
    updatedAt: "2026-07-05T14:02:45Z",
    events: [
      { id: "evt_1401", type: "created",    status: "pending",    title: "Payment Created",    description: "Server hosting payment initiated.",                         timestamp: "2026-07-05T14:00:00Z", actor: "Orbit Gaming" },
      { id: "evt_1402", type: "processing", status: "processing", title: "Processing Started", description: "Payment queued.",                                          timestamp: "2026-07-05T14:00:30Z", actor: "FacilPay Engine" },
      { id: "evt_1403", type: "failed",     status: "failed",     title: "Transaction Failed", description: "Solana program error: insufficient funds in fee account.", timestamp: "2026-07-05T14:02:45Z", actor: "Solana Network", metadata: { errorCode: "AccountNotFound", slot: 285500000 } },
    ],
    canRefund: false,
    canCancel: false,
    canRetry: true,
  },
  // ── 16 ─────────────────────────────────────────────────────────────────────
  {
    id: "pay_16y4mz7b8c9d0e1f2g3h4i5k",
    reference: "FP-2026-00117",
    status: "completed",
    method: "crypto",
    network: "ethereum",
    amount: 450.0,
    currency: "USDC",
    amountUsd: 450.0,
    sender: {
      name: "Halo Fintech",
      accountId: "acc_sender_120",
      walletAddress: "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB",
      email: "treasury@halofintech.com",
    },
    recipient: {
      name: "Audit Shield",
      accountId: "acc_recipient_121",
      walletAddress: "0x583031D1113aD414F02576BD6afaBfb302140225",
    },
    description: "Smart contract audit — Stage 1",
    tags: ["audit", "defi"],
    createdAt: "2026-06-25T12:00:00Z",
    updatedAt: "2026-06-25T12:10:00Z",
    completedAt: "2026-06-25T12:10:00Z",
    onChain: {
      network: "ethereum",
      txHash: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
      blockNumber: 20100500,
      confirmations: 120,
      requiredConfirmations: 12,
      fee: 0.0018,
      feeAsset: "ETH",
      fromAddress: "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB",
      toAddress: "0x583031D1113aD414F02576BD6afaBfb302140225",
      explorerUrl: "https://etherscan.io/tx/0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
      broadcastAt: "2026-06-25T12:02:00Z",
      confirmedAt: "2026-06-25T12:10:00Z",
    },
    events: [
      { id: "evt_1501", type: "created",   status: "pending",    title: "Payment Created",       description: "Audit stage 1 payment.", timestamp: "2026-06-25T12:00:00Z", actor: "Halo Fintech" },
      { id: "evt_1502", type: "broadcast", status: "processing", title: "Transaction Broadcast", description: "Submitted to Ethereum.", timestamp: "2026-06-25T12:02:00Z", actor: "FacilPay Engine" },
      { id: "evt_1503", type: "completed", status: "completed",  title: "Payment Completed",     description: "Confirmed on Ethereum.", timestamp: "2026-06-25T12:10:00Z", actor: "FacilPay Engine" },
    ],
    canRefund: true,
    canCancel: false,
    canRetry: false,
  },
  // ── 17 ─────────────────────────────────────────────────────────────────────
  {
    id: "pay_17z5na8c9d0e1f2g3h4i5j6l",
    reference: "FP-2026-00104",
    status: "refunded",
    method: "crypto",
    network: "stellar",
    amount: 230.0,
    currency: "USDC",
    amountUsd: 230.0,
    sender: {
      name: "FreshCart",
      accountId: "acc_sender_130",
      walletAddress: "GBXGQJWRYP7RZFMBDNFMTFDTPNV3R8TDTMQHKEWL5FXKWIFZ5DFVKXZ",
      email: "finance@freshcart.market",
    },
    recipient: {
      name: "ColdChain Delivery",
      accountId: "acc_recipient_131",
      walletAddress: "GCMNSJ3QWKBQ5YPXKPZ7LXQW5MGKQ5TQZR3ZXQKQV5DVBB4PKJFZX",
    },
    description: "Cold chain delivery — July batch",
    tags: ["logistics", "cold-chain"],
    createdAt: "2026-06-10T08:00:00Z",
    updatedAt: "2026-06-11T14:00:00Z",
    completedAt: "2026-06-10T08:12:00Z",
    onChain: {
      network: "stellar",
      txHash: "b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1",
      blockNumber: 52200100,
      confirmations: 300,
      requiredConfirmations: 1,
      fee: 0.00001,
      feeAsset: "XLM",
      fromAddress: "GBXGQJWRYP7RZFMBDNFMTFDTPNV3R8TDTMQHKEWL5FXKWIFZ5DFVKXZ",
      toAddress: "GCMNSJ3QWKBQ5YPXKPZ7LXQW5MGKQ5TQZR3ZXQKQV5DVBB4PKJFZX",
      memoText: "FP-2026-00104",
      explorerUrl: "https://stellar.expert/explorer/public/tx/b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1",
      broadcastAt: "2026-06-10T08:03:00Z",
      confirmedAt: "2026-06-10T08:12:00Z",
    },
    events: [
      { id: "evt_1601", type: "created",         status: "pending",   title: "Payment Created",   description: "Delivery payment created.",                   timestamp: "2026-06-10T08:00:00Z", actor: "FreshCart" },
      { id: "evt_1602", type: "completed",       status: "completed", title: "Payment Completed", description: "Delivery confirmed.",                          timestamp: "2026-06-10T08:12:00Z", actor: "FacilPay Engine" },
      { id: "evt_1603", type: "refund_initiated",status: "refunded",  title: "Refund Initiated",  description: "Delivery arrived damaged; refund requested.", timestamp: "2026-06-11T10:00:00Z", actor: "FreshCart (support)" },
      { id: "evt_1604", type: "refunded",        status: "refunded",  title: "Refund Completed",  description: "230 USDC returned.",                          timestamp: "2026-06-11T14:00:00Z", actor: "FacilPay Engine" },
    ],
    canRefund: false,
    canCancel: false,
    canRetry: false,
  },
  // ── 18 ─────────────────────────────────────────────────────────────────────
  {
    id: "pay_18a6ob9d0e1f2g3h4i5j6k7m",
    reference: "FP-2026-00093",
    status: "processing",
    method: "crypto",
    network: "ethereum",
    amount: 6300.0,
    currency: "USDT",
    amountUsd: 6300.0,
    sender: {
      name: "Quantum Labs",
      accountId: "acc_sender_140",
      walletAddress: "0xDd2FD4581271e230360230Fc38a8C5E2b3E5c3E1",
      email: "finance@quantumlabs.tech",
    },
    recipient: {
      name: "HPC Cloud",
      accountId: "acc_recipient_141",
      walletAddress: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    },
    description: "HPC cluster rental — Q3 2026",
    tags: ["cloud", "hpc", "enterprise"],
    createdAt: "2026-05-20T10:00:00Z",
    updatedAt: "2026-05-20T10:05:00Z",
    onChain: {
      network: "ethereum",
      txHash: "0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
      confirmations: 8,
      requiredConfirmations: 12,
      fee: 0.0025,
      feeAsset: "ETH",
      fromAddress: "0xDd2FD4581271e230360230Fc38a8C5E2b3E5c3E1",
      toAddress: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      explorerUrl: "https://etherscan.io/tx/0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
      broadcastAt: "2026-05-20T10:03:00Z",
    },
    events: [
      { id: "evt_1701", type: "created",   status: "pending",    title: "Payment Created",       description: "HPC rental payment initiated.",        timestamp: "2026-05-20T10:00:00Z", actor: "Quantum Labs" },
      { id: "evt_1702", type: "broadcast", status: "processing", title: "Transaction Broadcast", description: "Submitted to Ethereum, awaiting 12 confirmations.", timestamp: "2026-05-20T10:03:00Z", actor: "FacilPay Engine", metadata: { confirmations: 8, required: 12 } },
    ],
    canRefund: false,
    canCancel: true,
    canRetry: false,
  },
  // ── 19 ─────────────────────────────────────────────────────────────────────
  {
    id: "pay_19b7pc0e1f2g3h4i5j6k7l8n",
    reference: "FP-2026-00081",
    status: "completed",
    method: "crypto",
    network: "bitcoin",
    amount: 0.012,
    currency: "BTC",
    amountUsd: 768.0,
    sender: {
      name: "DigitalNomad LLC",
      accountId: "acc_sender_150",
      walletAddress: "bc1p5d7rjq7g6qlpqjk8emjw0xnrqaaj7ftnzp3p6h49d7s4xdnm9msjnrdnm",
      email: "pay@digitalnomad.llc",
    },
    recipient: {
      name: "TaxEasy Services",
      accountId: "acc_recipient_151",
      walletAddress: "bc1qnjg0jd8pnm90xu5lhxqpj3w3zfcqxl2jlx6mg",
    },
    description: "Tax filing service — FY2026",
    tags: ["tax", "services"],
    createdAt: "2026-04-30T09:00:00Z",
    updatedAt: "2026-04-30T10:10:00Z",
    completedAt: "2026-04-30T10:10:00Z",
    onChain: {
      network: "bitcoin",
      txHash: "a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3",
      blockNumber: 843100,
      confirmations: 6,
      requiredConfirmations: 6,
      fee: 0.00001,
      feeAsset: "BTC",
      fromAddress: "bc1p5d7rjq7g6qlpqjk8emjw0xnrqaaj7ftnzp3p6h49d7s4xdnm9msjnrdnm",
      toAddress: "bc1qnjg0jd8pnm90xu5lhxqpj3w3zfcqxl2jlx6mg",
      explorerUrl: "https://mempool.space/tx/a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3",
      broadcastAt: "2026-04-30T09:10:00Z",
      confirmedAt: "2026-04-30T10:10:00Z",
    },
    events: [
      { id: "evt_1801", type: "created",   status: "pending",    title: "Payment Created",       description: "Tax service payment.",       timestamp: "2026-04-30T09:00:00Z", actor: "DigitalNomad LLC" },
      { id: "evt_1802", type: "broadcast", status: "processing", title: "Transaction Broadcast", description: "Submitted to Bitcoin.",       timestamp: "2026-04-30T09:10:00Z", actor: "FacilPay Engine" },
      { id: "evt_1803", type: "confirmed", status: "processing", title: "Confirmations Reached", description: "6/6 confirmations done.",    timestamp: "2026-04-30T10:00:00Z", actor: "Bitcoin Network" },
      { id: "evt_1804", type: "completed", status: "completed",  title: "Payment Completed",     description: "Settlement finalised.",       timestamp: "2026-04-30T10:10:00Z", actor: "FacilPay Engine" },
    ],
    canRefund: false,
    canCancel: false,
    canRetry: false,
  },
  // ── 20 ─────────────────────────────────────────────────────────────────────
  {
    id: "pay_20c8qd1f2g3h4i5j6k7l8m9o",
    reference: "FP-2026-00070",
    status: "cancelled",
    method: "crypto",
    network: "solana",
    amount: 99.0,
    currency: "USDC",
    amountUsd: 99.0,
    sender: {
      name: "Bloom Health",
      accountId: "acc_sender_160",
      walletAddress: "FqsLFSJ4XHGA7X6GHzjC4X7kh6RbiBYmgfNMxKqRioCb",
      email: "billing@bloomhealth.app",
    },
    recipient: {
      name: "MediData Insights",
      accountId: "acc_recipient_161",
      walletAddress: "He2JXLS5CbQerVSM1B9KJFuWbWGBN1fWnp6V6XpvRsLu",
    },
    description: "Health analytics API — monthly plan",
    tags: ["health", "saas", "monthly"],
    createdAt: "2026-04-01T08:00:00Z",
    updatedAt: "2026-04-01T08:10:00Z",
    events: [
      { id: "evt_1901", type: "created",   status: "pending",   title: "Payment Created",   description: "Monthly API subscription.",               timestamp: "2026-04-01T08:00:00Z", actor: "Bloom Health" },
      { id: "evt_1902", type: "cancelled", status: "cancelled", title: "Payment Cancelled", description: "Cancelled; merchant switched providers.", timestamp: "2026-04-01T08:10:00Z", actor: "Bloom Health (admin)" },
    ],
    canRefund: false,
    canCancel: false,
    canRetry: false,
  },
];

// ─── Sorting ──────────────────────────────────────────────────────────────────

function sortPayments(
  payments: Payment[],
  sortField: PaymentSortField,
  sortOrder: PaymentSortOrder
): Payment[] {
  const dir = sortOrder === "asc" ? 1 : -1;

  return [...payments].sort((a, b) => {
    switch (sortField) {
      case "createdAt":
        return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "amount":
        return dir * ((a.amountUsd ?? a.amount) - (b.amountUsd ?? b.amount));
      case "status":
        return dir * a.status.localeCompare(b.status);
      case "reference":
        return dir * a.reference.localeCompare(b.reference);
      default:
        return 0;
    }
  });
}

// ─── Filtering ────────────────────────────────────────────────────────────────

function applyFilters(payments: Payment[], filter: PaymentFilter): Payment[] {
  let results = payments;

  if (filter.status) {
    results = results.filter((p) => p.status === filter.status);
  }
  if (filter.network) {
    results = results.filter((p) => p.network === filter.network);
  }
  if (filter.method) {
    results = results.filter((p) => p.method === filter.method);
  }
  if (filter.dateFrom) {
    const from = new Date(filter.dateFrom).getTime();
    results = results.filter((p) => new Date(p.createdAt).getTime() >= from);
  }
  if (filter.dateTo) {
    // Include the full end day by advancing to midnight of the next day
    const to = new Date(filter.dateTo);
    to.setDate(to.getDate() + 1);
    results = results.filter((p) => new Date(p.createdAt).getTime() < to.getTime());
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    results = results.filter(
      (p) =>
        p.reference.toLowerCase().includes(q) ||
        p.sender.name.toLowerCase().includes(q) ||
        p.recipient.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  return results;
}

// ─── Simulated delay ─────────────────────────────────────────────────────────

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Public async API (server / SSR use) ─────────────────────────────────────

export async function getPayments(
  filter: PaymentFilter = {},
  page = 1,
  pageSize = 10,
  sortField: PaymentSortField = "createdAt",
  sortOrder: PaymentSortOrder = "desc"
): Promise<PaginatedPayments> {
  await delay();

  const filtered = applyFilters(MOCK_PAYMENTS, filter);
  const sorted   = sortPayments(filtered, sortField, sortOrder);

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const data  = sorted.slice(start, start + pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    hasNextPage: start + pageSize < total,
    hasPrevPage: page > 1,
  };
}

/** Synchronous version for use in Client Components (no async/await overhead). */
export function getPaymentsSync(
  filter: PaymentFilter = {},
  page = 1,
  pageSize = 10,
  sortField: PaymentSortField = "createdAt",
  sortOrder: PaymentSortOrder = "desc"
): PaginatedPayments {
  const filtered = applyFilters(MOCK_PAYMENTS, filter);
  const sorted   = sortPayments(filtered, sortField, sortOrder);

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const data  = sorted.slice(start, start + pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    hasNextPage: start + pageSize < total,
    hasPrevPage: page > 1,
  };
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  await delay();
  return MOCK_PAYMENTS.find((p) => p.id === id) ?? null;
}

export async function getPaymentByReference(reference: string): Promise<Payment | null> {
  await delay();
  return MOCK_PAYMENTS.find((p) => p.reference === reference) ?? null;
}

export function getAllStatuses(): PaymentStatus[] {
  const set = new Set(MOCK_PAYMENTS.map((p) => p.status));
  return Array.from(set);
}

export function getMockPayments(): Payment[] {
  return MOCK_PAYMENTS;
}
