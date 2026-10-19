"use client";

import { requestAccess, signTransaction } from "@stellar/freighter-api";
import {
  Address,
  Contract,
  Networks,
  rpc,
  TransactionBuilder,
  nativeToScVal,
} from "@stellar/stellar-sdk";
import { useMemo, useState } from "react";

type Payment = {
  id: string;
  customer: string;
  email: string;
  payer: string;
  amount: number;
  refunded: number;
  asset: string;
  date: string;
  status: "completed" | "partially_refunded" | "refunded";
};

type RefundReason = "Duplicate" | "Fraudulent" | "Customer request" | "Other";
type RefundStage = "form" | "review" | "simulating" | "signing" | "submitting" | "confirmed";

const initialPayments: Payment[] = [
  { id: "80421", customer: "Maya Chen", email: "maya.chen@example.com", payer: "GBT5PBINLNRI5RJPJBOPSMODBGIHALJQJ2ISTANRF54BGM2WVIBECCNB", amount: 248.5, refunded: 0, asset: "USDC", date: "Today, 10:42 AM", status: "completed" },
  { id: "80420", customer: "Jonas Weber", email: "jonas.w@example.com", payer: "GB33PD2PR277PFLGOBAIT25RAWUTHA74Q2Z25IGTLSRRAURVPOZFLD3L", amount: 89, refunded: 24, asset: "USDC", date: "Today, 9:18 AM", status: "partially_refunded" },
  { id: "80419", customer: "Aisha Bello", email: "aisha.b@example.com", payer: "GBHLJUYQYT5AGOIGXEIQG3CH2WTVSKUTODCFVN5F6LVL2JSVFHII6OAD", amount: 512, refunded: 512, asset: "USDC", date: "Yesterday, 4:06 PM", status: "refunded" },
  { id: "80418", customer: "Lucas Martin", email: "lucas.m@example.com", payer: "GBSXXD3OAJY36MNINA3QEEVDCHZJIB3PWLNBNMGJ2FYZMVIAWAP22PU3", amount: 175.25, refunded: 0, asset: "USDC", date: "Yesterday, 1:33 PM", status: "completed" },
  { id: "80417", customer: "Sofia Reyes", email: "sofia.r@example.com", payer: "GBZZQDBG2WI2EH4UGSNCAI4I55FWANFTXWA5KHQKB2IFJIWZITTRIQVB", amount: 64.99, refunded: 0, asset: "USDC", date: "Sep 24, 11:12 AM", status: "completed" },
];

const reasons: RefundReason[] = ["Duplicate", "Fraudulent", "Customer request", "Other"];
const explorerBase = ["public", "mainnet"].includes(process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "")
  ? "https://stellar.expert/explorer/public/tx/"
  : "https://stellar.expert/explorer/testnet/tx/";

function formatAmount(amount: number, asset: string) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ` ${asset}`;
}

function shortAddress(address: string) {
  return `${address.slice(0, 7)}...${address.slice(-6)}`;
}

function explainError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes("reject") || lower.includes("declin") || lower.includes("cancel")) return "The wallet signature was rejected. No refund was submitted.";
  if (lower.includes("insufficient") || lower.includes("balance")) return "The merchant wallet does not have enough balance to cover this refund or its network fee.";
  if (lower.includes("refund_contract_id") || lower.includes("contract id")) return "Refunds are not configured yet. Add NEXT_PUBLIC_REFUND_CONTRACT_ID and try again.";
  if (lower.includes("simulation") || lower.includes("host function") || lower.includes("contract")) return "This payment could not be refunded on the configured network. Check that its payment ID, asset, and refundable balance match the refund contract.";
  return `The refund could not be completed: ${message}`;
}

export default function Home() {
  const [payments, setPayments] = useState(initialPayments);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [refundPaymentId, setRefundPaymentId] = useState<string | null>(null);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<RefundReason>("Customer request");
  const [note, setNote] = useState("");
  const [stage, setStage] = useState<RefundStage>("form");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedPayment = payments.find((payment) => payment.id === selectedPaymentId) ?? null;
  const refundPayment = payments.find((payment) => payment.id === refundPaymentId) ?? null;
  const refundable = refundPayment ? Math.max(0, refundPayment.amount - refundPayment.refunded) : 0;
  const precision = refundPayment?.asset === "XLM" ? 7 : 7;
  const enteredAmount = Number(amount);
  const amountValid = Boolean(amount) && Number.isFinite(enteredAmount) && enteredAmount > 0 && enteredAmount <= refundable && new RegExp(`^\\d+(\\.\\d{1,${precision}})?$`).test(amount);

  const filteredPayments = useMemo(() => {
    const query = paymentSearch.trim().toLowerCase();
    if (!query) return payments;
    return payments.filter((payment) => `${payment.id} ${payment.customer} ${payment.email}`.toLowerCase().includes(query));
  }, [paymentSearch, payments]);

  function openRefund(payment: Payment) {
    setRefundPaymentId(payment.id);
    setMode("full");
    setAmount((payment.amount - payment.refunded).toFixed(2));
    setReason("Customer request");
    setNote("");
    setStage("form");
    setError("");
    setTransactionHash("");
    setQuickActionOpen(false);
  }

  function closeRefund() {
    if (busy) return;
    setRefundPaymentId(null);
    setError("");
  }

  function selectMode(nextMode: "full" | "partial") {
    setMode(nextMode);
    if (nextMode === "full" && refundPayment) setAmount(refundable.toFixed(2));
    if (nextMode === "partial") setAmount("");
  }

  async function connectWallet() {
    try {
      const result = await requestAccess();
      if (result.error) throw result.error;
      setWalletAddress(result.address);
      setToast("Wallet connected");
    } catch (connectError) {
      setError(explainError(connectError));
    }
  }

  async function submitRefund() {
    if (!refundPayment || !amountValid) return;
    setBusy(true);
    setError("");
    setStage("simulating");
    try {
      const contractId = process.env.NEXT_PUBLIC_REFUND_CONTRACT_ID;
      if (!contractId) throw new Error("NEXT_PUBLIC_REFUND_CONTRACT_ID is not configured");

      const wallet = walletAddress ? { address: walletAddress } : await requestAccess();
      if ("error" in wallet && wallet.error) throw wallet.error;
      const signer = wallet.address;
      setWalletAddress(signer);
      const walletNetwork = await import("@stellar/freighter-api").then((api) => api.getNetworkDetails());
      if (walletNetwork.error) throw walletNetwork.error;
      const networkPassphrase = walletNetwork.networkPassphrase || Networks.TESTNET;
      const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || walletNetwork.sorobanRpcUrl || "https://soroban-testnet.stellar.org";
      const server = new rpc.Server(rpcUrl);
      const account = await server.getAccount(signer);
      const subunits = BigInt(amount.split(".")[0]) * BigInt("10000000") + BigInt((amount.split(".")[1] ?? "").padEnd(7, "0").slice(0, 7));
      const reasonText = note.trim() ? `${reason}: ${note.trim()}` : reason;
      const contract = new Contract(contractId);
      const transaction = new TransactionBuilder(account, { fee: "100000", networkPassphrase })
        .addOperation(contract.call(
          "refund",
          nativeToScVal(BigInt(refundPayment.id), { type: "u64" }),
          nativeToScVal(subunits, { type: "i128" }),
          new Address(refundPayment.payer).toScVal(),
          nativeToScVal(reasonText, { type: "string" }),
        ))
        .setTimeout(180)
        .build();

      const simulation = await server.simulateTransaction(transaction);
      if ("error" in simulation && simulation.error) throw new Error(`Simulation failed: ${simulation.error}`);
      const prepared = rpc.assembleTransaction(transaction, simulation).build();
      setStage("signing");
      const signature = await signTransaction(prepared.toXDR(), { networkPassphrase, address: signer });
      if (signature.error) throw signature.error;

      setStage("submitting");
      const signed = TransactionBuilder.fromXDR(signature.signedTxXdr, networkPassphrase);
      const submitted = await server.sendTransaction(signed);
      if (submitted.status === "ERROR") throw new Error("Transaction submission failed. Check the wallet balance and try again.");
      setTransactionHash(submitted.hash);

      let result = await server.getTransaction(submitted.hash);
      for (let attempt = 0; result.status === "NOT_FOUND" && attempt < 15; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        result = await server.getTransaction(submitted.hash);
      }
      if (result.status === "FAILED") throw new Error("The network rejected the refund transaction after submission.");
      if (result.status !== "SUCCESS") throw new Error("The refund was submitted but has not confirmed yet. Check the transaction link shortly.");

      setPayments((current) => current.map((payment) => {
        if (payment.id !== refundPayment.id) return payment;
        const refunded = Math.min(payment.amount, payment.refunded + enteredAmount);
        return { ...payment, refunded, status: refunded >= payment.amount ? "refunded" : "partially_refunded" };
      }));
      setStage("confirmed");
      setToast(`Refund confirmed for ${formatAmount(enteredAmount, refundPayment.asset)}`);
    } catch (refundError) {
      setError(explainError(refundError));
      if (stage === "simulating") setStage("form");
      else setStage("review");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel = (payment: Payment) => payment.status === "partially_refunded" ? "Partially refunded" : payment.status === "refunded" ? "Refunded" : "Completed";

  return (
    <main className="workspace">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setSelectedPaymentId(null)} aria-label="FacilPay home">
          <span className="brand-mark">f</span><span>facilpay<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <button className={`nav-item ${!selectedPayment ? "active" : ""}`} onClick={() => setSelectedPaymentId(null)}><span className="nav-glyph">◫</span> Overview</button>
        <button className={`nav-item ${selectedPayment ? "active" : ""}`} onClick={() => setSelectedPaymentId(null)}><span className="nav-glyph">↔</span> Payments</button>
        <div className="sidebar-bottom">
          <div className="network-state"><span className="online-dot" /> Testnet</div>
          <button className="wallet-button" onClick={connectWallet} title={walletAddress || "Connect Freighter wallet"}>
            <span className="wallet-symbol">◈</span>{walletAddress ? shortAddress(walletAddress) : "Connect wallet"}
          </button>
          <div className="merchant-card"><span className="merchant-avatar">N</span><span><b>Northstar Goods</b><small>Merchant account</small></span><span className="more-mark">···</span></div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{selectedPayment ? "Payment details" : "Overview"}</strong></div>
          <div className="topbar-actions"><span className="environment"><i /> TESTNET</span><button className="avatar-button" aria-label="Account menu">N</button></div>
        </header>

        <div className="content">
          {selectedPayment ? (
            <>
              <button className="back-link" onClick={() => setSelectedPaymentId(null)}>← Back to payments</button>
              <div className="page-heading detail-heading"><div><span className="eyebrow">PAYMENT FP-{selectedPayment.id}</span><h1>Payment details</h1><p>Review the payment and manage refunds.</p></div>
                {selectedPayment.amount > selectedPayment.refunded && <button className="primary-button" onClick={() => openRefund(selectedPayment)}>↗ <span>Refund</span></button>}
              </div>
              <section className="detail-grid">
                <div className="detail-panel"><div className="panel-title">Payment summary <span className={`status-pill ${selectedPayment.status}`}>{statusLabel(selectedPayment)}</span></div>
                  <div className="amount-large">{formatAmount(selectedPayment.amount, selectedPayment.asset)}</div><div className="muted-line">Captured {selectedPayment.date}</div>
                  <div className="detail-rule" />
                  <dl className="detail-list"><div><dt>Payment ID</dt><dd>FP-{selectedPayment.id}</dd></div><div><dt>Customer</dt><dd>{selectedPayment.customer}<small>{selectedPayment.email}</small></dd></div><div><dt>Original payer</dt><dd className="mono-address">{shortAddress(selectedPayment.payer)}<button className="copy-small" onClick={() => navigator.clipboard.writeText(selectedPayment.payer)} aria-label="Copy payer address">⧉</button></dd></div><div><dt>Refunded</dt><dd>{formatAmount(selectedPayment.refunded, selectedPayment.asset)}</dd></div><div><dt>Refundable balance</dt><dd className="balance-value">{formatAmount(selectedPayment.amount - selectedPayment.refunded, selectedPayment.asset)}</dd></div></dl>
                </div>
                <div className="detail-panel timeline-panel"><div className="panel-title">Activity</div><div className="timeline"><div className="timeline-entry"><span className="timeline-dot paid"/><div><b>Payment completed</b><small>{selectedPayment.date}</small></div><strong>{formatAmount(selectedPayment.amount, selectedPayment.asset)}</strong></div>{selectedPayment.refunded > 0 && <div className="timeline-entry"><span className="timeline-dot refund"/><div><b>Refunds issued</b><small>Recorded on chain</small></div><strong>-{formatAmount(selectedPayment.refunded, selectedPayment.asset)}</strong></div>}</div></div>
              </section>
            </>
          ) : (
            <>
              <div className="page-heading"><div><span className="eyebrow">SATURDAY, SEPTEMBER 26, 2026</span><h1>Good morning, Northstar</h1><p>Here’s what’s happening with your payments.</p></div><button className="primary-button" onClick={() => { setQuickActionOpen(true); setPaymentSearch(""); }}>↗ <span>Issue refund</span></button></div>
              <section className="metric-grid" aria-label="Payment overview">
                <article className="metric-card"><div className="metric-label">Gross volume <span className="metric-icon green">↗</span></div><strong>$12,840.50</strong><div className="metric-note"><span className="up-change">↑ 12.8%</span> vs. last month</div></article>
                <article className="metric-card"><div className="metric-label">Successful payments <span className="metric-icon blue">✓</span></div><strong>248</strong><div className="metric-note"><span className="up-change">↑ 8.2%</span> vs. last month</div></article>
                <article className="metric-card"><div className="metric-label">Refunds issued <span className="metric-icon orange">↩</span></div><strong>{formatAmount(payments.reduce((sum, payment) => sum + payment.refunded, 0), "USDC")}</strong><div className="metric-note">Across {payments.filter((payment) => payment.refunded > 0).length} payments</div></article>
              </section>
              <section className="payments-section">
                <div className="section-heading"><div><h2>Recent payments</h2><p>Monitor payments and issue refunds.</p></div><button className="quiet-button" onClick={() => { setQuickActionOpen(true); setPaymentSearch(""); }}>Find a payment <span>⌕</span></button></div>
                <div className="table-wrap"><table><thead><tr><th>PAYMENT</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th><th aria-label="Actions"/></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} onClick={() => setSelectedPaymentId(payment.id)}><td><button className="payment-id" onClick={(event) => { event.stopPropagation(); setSelectedPaymentId(payment.id); }}>FP-{payment.id}</button></td><td><span className="customer-name">{payment.customer}</span><small className="customer-email">{payment.email}</small></td><td className="date-cell">{payment.date}</td><td className="amount-cell">{formatAmount(payment.amount, payment.asset)}</td><td><span className={`status-pill ${payment.status}`}>{statusLabel(payment)}</span></td><td><button className="row-action" title="Open payment details" aria-label={`Open FP-${payment.id}`}>→</button></td></tr>)}</tbody></table></div>
                <div className="table-footer"><span>Showing {payments.length} of {payments.length} payments</span><button onClick={() => { setPaymentSearch(""); setQuickActionOpen(true); }}>Search payments →</button></div>
              </section>
              <div className="bottom-note"><span>◈</span> Payments are secured on the Stellar network <a href="https://stellar.org" target="_blank" rel="noreferrer">About Stellar ↗</a></div>
            </>
          )}
        </div>
      </section>

      {toast && <div className="toast" role="status"><span>✓</span>{toast}{transactionHash && <a href={`${explorerBase}${transactionHash}`} target="_blank" rel="noreferrer">View transaction ↗</a>}<button onClick={() => setToast("")} aria-label="Dismiss notification">×</button></div>}

      {quickActionOpen && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuickActionOpen(false); }}><section className="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-title"><button className="modal-close" onClick={() => setQuickActionOpen(false)} aria-label="Close">×</button><span className="eyebrow">QUICK ACTION</span><h2 id="search-title">Find a payment</h2><p>Choose a completed payment to issue a refund.</p><label className="search-field"><span>⌕</span><input autoFocus value={paymentSearch} onChange={(event) => setPaymentSearch(event.target.value)} placeholder="Search by ID, customer or email" /></label><div className="search-results">{filteredPayments.length ? filteredPayments.map((payment) => <button className="search-result" key={payment.id} disabled={payment.amount <= payment.refunded} onClick={() => openRefund(payment)}><span className="result-avatar">{payment.customer.split(" ").map((part) => part[0]).join("")}</span><span className="result-main"><b>{payment.customer}</b><small>FP-{payment.id} · {statusLabel(payment)}</small></span><strong>{formatAmount(payment.amount - payment.refunded, payment.asset)}<small>refundable</small></strong><span className="result-arrow">→</span></button>) : <div className="empty-search">No matching payments found.</div>}</div></section></div>}

      {refundPayment && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRefund(); }}><section className="refund-dialog" role="dialog" aria-modal="true" aria-labelledby="refund-title">
        {!busy && stage !== "confirmed" && <button className="modal-close" onClick={closeRefund} aria-label="Close">×</button>}
        {stage === "confirmed" ? <div className="outcome"><span className="outcome-check">✓</span><span className="eyebrow">REFUND CONFIRMED</span><h2 id="refund-title">Refund issued</h2><p>{formatAmount(enteredAmount, refundPayment.asset)} has been sent to {refundPayment.customer}.</p><div className="confirmation-details"><span>Transaction</span><a href={`${explorerBase}${transactionHash}`} target="_blank" rel="noreferrer">{shortAddress(transactionHash)} ↗</a></div><button className="primary-button full-button" onClick={() => { setRefundPaymentId(null); setSelectedPaymentId(refundPayment.id); }}>Done</button></div> : <>
          <div className="dialog-head"><span className="eyebrow">PAYMENT FP-{refundPayment.id}</span><h2 id="refund-title">Issue a refund</h2><p>Refunds are sent to the original payer.</p></div>
          <div className="refund-summary"><div><span>Original amount</span><strong>{formatAmount(refundPayment.amount, refundPayment.asset)}</strong></div><div><span>Already refunded</span><strong>{formatAmount(refundPayment.refunded, refundPayment.asset)}</strong></div><div className="refundable-row"><span>Refundable balance</span><strong>{formatAmount(refundable, refundPayment.asset)}</strong></div></div>
          {stage === "form" ? <>
            <div className="form-field"><span className="field-label">Refund type</span><div className="segmented-control"><button className={mode === "full" ? "selected" : ""} onClick={() => selectMode("full")}>Full refund</button><button className={mode === "partial" ? "selected" : ""} onClick={() => selectMode("partial")}>Partial refund</button></div></div>
            <div className="form-field"><label className="field-label" htmlFor="refund-amount">Amount</label><div className={`amount-input ${amount && !amountValid ? "invalid" : ""}`}><input id="refund-amount" inputMode="decimal" value={amount} onChange={(event) => { setMode("partial"); setAmount(event.target.value); }} aria-describedby="amount-help"/><span>{refundPayment.asset}</span><button onClick={() => { setMode("full"); setAmount(refundable.toFixed(2)); }}>Max</button></div><small id="amount-help" className={amount && !amountValid ? "field-error" : "field-hint"}>{amount && !amountValid ? `Enter an amount greater than 0, up to ${formatAmount(refundable, refundPayment.asset)}, with up to ${precision} decimals.` : `Up to ${precision} decimal places. Maximum ${formatAmount(refundable, refundPayment.asset)}.`}</small></div>
            <div className="form-field"><label className="field-label" htmlFor="refund-reason">Reason</label><select id="refund-reason" value={reason} onChange={(event) => setReason(event.target.value as RefundReason)}>{reasons.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div className="form-field"><label className="field-label" htmlFor="refund-note">Note <span>Optional</span></label><textarea id="refund-note" maxLength={160} rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context for your records" /></div>
            <div className="destination-field"><div><span className="field-label">Destination</span><strong>{shortAddress(refundPayment.payer)}</strong></div><button onClick={() => navigator.clipboard.writeText(refundPayment.payer)}>Copy address</button></div>
            {error && <div className="error-message" role="alert">{error}</div>}
            <button className="primary-button full-button" disabled={!amountValid} onClick={() => { setError(""); setStage("review"); }}>Review refund <span>→</span></button>
          </> : <>
            <div className="review-list"><div><span>Refund amount</span><strong>{formatAmount(enteredAmount, refundPayment.asset)}</strong></div><div><span>Asset</span><strong>{refundPayment.asset}</strong></div><div><span>Destination</span><strong className="mono-address">{shortAddress(refundPayment.payer)}</strong></div><div><span>Reason</span><strong>{reason}{note.trim() && ` · ${note.trim()}`}</strong></div><div><span>Estimated network fee</span><strong>~0.00001 XLM</strong></div></div>
            {stage === "simulating" || stage === "signing" || stage === "submitting" ? <div className="progress-list">{["Simulating", "Signing", "Submitting", "Confirmed"].map((item, index) => { const activeIndex = stage === "simulating" ? 0 : stage === "signing" ? 1 : 2; return <div className={`progress-step ${index < activeIndex ? "done" : index === activeIndex ? "current" : ""}`} key={item}><span>{index < activeIndex ? "✓" : index + 1}</span>{item}{index === activeIndex && <i />}</div>; })}</div> : null}
            {error && <div className="error-message" role="alert">{error}</div>}
            <div className="review-actions"><button className="secondary-button" disabled={busy} onClick={() => { setStage("form"); setError(""); }}>Back</button><button className="primary-button" disabled={busy} onClick={submitRefund}>{busy ? "Processing..." : "Confirm and sign"}<span>→</span></button></div>
          </>}
        </>}
      </section></div>}
    </main>
  );
}
