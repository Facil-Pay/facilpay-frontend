"use client";

import { useMemo, useState } from "react";
import styles from "./escrow.module.css";

type EscrowStatus = "funded" | "released" | "disputed" | "refunded" | "expired";
type Filter = "active" | "released" | "disputed" | "all";
type Action = "release" | "refund" | "dispute";

type Escrow = {
  id: string;
  payment: string;
  amount: string;
  asset: string;
  status: EscrowStatus;
  date: string;
  dateLabel: string;
  counterparty: string;
  initials: string;
  condition: string;
  deadline: string;
  payer: string;
  recipient: string;
};

const escrows: Escrow[] = [
  { id: "ESC-1048", payment: "PAY-83721", amount: "4,250.00", asset: "USDC", status: "funded", date: "2026-10-02", dateLabel: "Oct 02, 2026", counterparty: "Northstar Labs", initials: "NL", condition: "Milestone 2 accepted", deadline: "6d 14h", payer: "Aster Studio", recipient: "Northstar Labs" },
  { id: "ESC-1044", payment: "PAY-83692", amount: "18,900.00", asset: "USDC", status: "funded", date: "2026-10-04", dateLabel: "Oct 04, 2026", counterparty: "Vertex Commerce", initials: "VC", condition: "Delivery confirmed", deadline: "8d 02h", payer: "Aster Studio", recipient: "Vertex Commerce" },
  { id: "ESC-1039", payment: "PAY-83511", amount: "2,480.00", asset: "XLM", status: "disputed", date: "2026-09-28", dateLabel: "Sep 28, 2026", counterparty: "Morrow Design Co.", initials: "MD", condition: "Scope review requested", deadline: "2d 09h", payer: "Aster Studio", recipient: "Morrow Design Co." },
  { id: "ESC-1031", payment: "PAY-83204", amount: "9,750.00", asset: "USDC", status: "released", date: "2026-09-18", dateLabel: "Sep 18, 2026", counterparty: "Kite Systems", initials: "KS", condition: "Both parties approved", deadline: "Complete", payer: "Aster Studio", recipient: "Kite Systems" },
  { id: "ESC-1027", payment: "PAY-83018", amount: "1,200.00", asset: "USDC", status: "refunded", date: "2026-09-12", dateLabel: "Sep 12, 2026", counterparty: "Harbor Goods", initials: "HG", condition: "Order cancelled", deadline: "Complete", payer: "Aster Studio", recipient: "Harbor Goods" },
];

const statusLabels: Record<EscrowStatus, string> = {
  funded: "Funded",
  released: "Released",
  disputed: "Disputed",
  refunded: "Refunded",
  expired: "Expired",
};

const tabs: { key: Filter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "released", label: "Released" },
  { key: "disputed", label: "Disputed" },
  { key: "all", label: "All escrows" },
];

export default function EscrowPage() {
  const [filter, setFilter] = useState<Filter>("active");
  const [selectedId, setSelectedId] = useState("ESC-1048");
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [notice, setNotice] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);

  const filteredEscrows = useMemo(() => escrows.filter((escrow) => {
    if (filter === "active") return escrow.status === "funded" || escrow.status === "disputed";
    if (filter === "released") return escrow.status === "released";
    if (filter === "disputed") return escrow.status === "disputed";
    return true;
  }), [filter]);

  const selected = escrows.find((escrow) => escrow.id === selectedId) ?? escrows[0];
  const actionLabel = pendingAction === "release" ? "Release funds" : pendingAction === "refund" ? "Refund to payer" : "Raise dispute";

  function requestAction(action: Action) {
    setNotice("");
    setPendingAction(action);
  }

  function confirmAction() {
    setPendingAction(null);
    setNotice(`${actionLabel} simulated successfully. Connect a wallet to submit this transaction.`);
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span className={styles.brandMark}>F</span><span>facil<span>pay</span></span></div>
        <div className={styles.workspace}><span className={styles.workspaceAvatar}>AS</span><span><strong>Aster Studio</strong><small>Merchant workspace</small></span><span className={styles.chevron}>⌄</span></div>
        <nav className={styles.nav} aria-label="Main navigation">
          <p className={styles.navLabel}>Workspace</p>
          <a href="#overview"><span className={styles.navIcon}>◈</span>Overview</a>
          <a href="#payments"><span className={styles.navIcon}>↗</span>Payments</a>
          <a href="/analytics"><span className={styles.navIcon}>◫</span>Analytics</a>
          <a className={styles.activeNav} href="/escrow"><span className={styles.navIcon}>◫</span>Escrow <span className={styles.navCount}>5</span></a>
          <a href="#customers"><span className={styles.navIcon}>◎</span>Customers</a>
          <p className={styles.navLabel}>Manage</p>
          <a href="#settings"><span className={styles.navIcon}>⚙</span>Settings</a>
          <a href="#docs"><span className={styles.navIcon}>▤</span>Developers</a>
        </nav>
        <div className={styles.sidebarBottom}><div className={styles.helpIcon}>?</div><div><strong>Need a hand?</strong><small>Visit the help center</small></div></div>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}><div className={styles.breadcrumb}>Workspace <span>/</span> Escrow</div><div className={styles.topActions}><button className={styles.iconButton} aria-label="Notifications">♧<i /></button><button className={styles.profileButton}><span className={styles.profileAvatar}>JD</span><span>Jordan Davis</span><span className={styles.chevron}>⌄</span></button></div></header>
        <div className={styles.page}>
          <div className={styles.pageHeading}><div><p className={styles.eyebrow}>Treasury / On-chain controls</p><h1>Escrow</h1><p className={styles.subheading}>Hold funds with confidence until every condition is met.</p></div><button className={`${styles.walletButton} ${walletConnected ? styles.walletConnected : ""}`} onClick={() => setWalletConnected(!walletConnected)}><span className={styles.walletDot} />{walletConnected ? "Wallet connected" : "Connect wallet"}</button></div>

          <div className={styles.metrics}><Metric label="Total in escrow" value="$25,630.00" detail="Across 2 active escrows" tone="blue" /><Metric label="Releasing next 7 days" value="$4,250.00" detail="1 escrow · Oct 02" tone="gold" /><Metric label="Needs attention" value="1" detail="Dispute requires a response" tone="red" /></div>

          <div className={styles.toolbar}><div className={styles.tabs}>{tabs.map((tab) => <button key={tab.key} className={filter === tab.key ? styles.tabActive : ""} onClick={() => setFilter(tab.key)}>{tab.label}{tab.key === "active" && <span>3</span>}</button>)}</div><div className={styles.toolbarRight}><label className={styles.search}><span>⌕</span><input aria-label="Search escrows" placeholder="Search escrows" /></label><button className={styles.filterButton}>≡ <span>Filter</span></button></div></div>

          <div className={styles.tableCard}><div className={styles.tableHeader}><span>{filteredEscrows.length} escrows</span><button className={styles.exportButton}>↓ Export</button></div><div className={styles.tableWrap}><table><thead><tr><th>Escrow</th><th>Amount</th><th>Status</th><th>Release date / condition</th><th>Counterparty</th><th /></tr></thead><tbody>{filteredEscrows.map((escrow) => <tr key={escrow.id} className={selectedId === escrow.id ? styles.selectedRow : ""} onClick={() => setSelectedId(escrow.id)}><td><strong>{escrow.id}</strong><small>{escrow.payment}</small></td><td><strong>{escrow.amount} {escrow.asset}</strong><small>≈ ${escrow.amount} USD</small></td><td><Status status={escrow.status} /></td><td><strong>{escrow.status === "funded" ? escrow.dateLabel : escrow.condition}</strong><small>{escrow.status === "funded" ? `in ${escrow.deadline}` : escrow.dateLabel}</small></td><td><span className={styles.counterparty}><span className={styles.counterpartyAvatar}>{escrow.initials}</span>{escrow.counterparty}</span></td><td><button className={styles.rowMenu} aria-label={`Open ${escrow.id}`}>•••</button></td></tr>)}</tbody></table></div></div>

          {notice && <div className={styles.notice}>{notice}<button onClick={() => setNotice("")}>×</button></div>}

          <div className={styles.detailGrid}><section className={styles.detailCard}><div className={styles.detailTop}><div><p className={styles.eyebrow}>Selected escrow</p><h2>{selected.id}</h2><p className={styles.detailPayment}>Linked to <strong>{selected.payment}</strong></p></div><Status status={selected.status} /></div><div className={styles.amountBlock}><span>Escrow balance</span><strong>{selected.amount} <small>{selected.asset}</small></strong><em>≈ ${selected.amount} USD</em></div><div className={styles.parties}><div><span>Payer</span><strong>{selected.payer}</strong><small>G...8F2A</small></div><div className={styles.partyLine} /><div><span>Payee</span><strong>{selected.recipient}</strong><small>N...4C91</small></div></div><div className={styles.conditionBox}><span className={styles.conditionIcon}>✓</span><div><span>Release condition</span><strong>{selected.condition}</strong></div><div className={styles.deadline}><span>Deadline</span><strong>{selected.deadline}</strong></div></div><div className={styles.actionRow}><button className={styles.primaryAction} onClick={() => requestAction("release")} disabled={selected.status !== "funded"}>Release funds</button><button className={styles.secondaryAction} onClick={() => requestAction("refund")} disabled={selected.status !== "funded"}>Refund</button><button className={styles.disputeAction} onClick={() => requestAction("dispute")} disabled={selected.status === "released" || selected.status === "refunded"}>Raise dispute</button></div></section>

          <section className={styles.sideDetail}><div className={styles.sideCard}><div className={styles.sideHeading}><h3>Contract state</h3><span className={styles.synced}><i />Synced</span></div><p className={styles.readOnly}>Read directly from Soroban RPC</p><div className={styles.stateRows}><StateRow label="Contract" value="C...9B72" /><StateRow label="Network" value="Stellar testnet" /><StateRow label="State" value={selected.status === "funded" ? "FUNDED" : selected.status.toUpperCase()} mono /><StateRow label="Last checked" value="12 seconds ago" /></div><a className={styles.explorerLink} href="#explorer">View on explorer ↗</a></div><div className={styles.sideCard}><h3>Event history</h3><div className={styles.timeline}><TimelineItem title="Escrow funded" date="Sep 26, 2026 · 09:42 UTC" active /><TimelineItem title="Condition updated" date="Sep 25, 2026 · 16:18 UTC" /><TimelineItem title="Escrow created" date="Sep 24, 2026 · 11:06 UTC" /></div></div></section></div>
        </div>
      </section>

      {pendingAction && <div className={styles.modalBackdrop}><div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="confirm-title"><button className={styles.modalClose} aria-label="Close confirmation" onClick={() => setPendingAction(null)}>×</button><div className={styles.modalIcon}>!</div><p className={styles.eyebrow}>Signature required</p><h2 id="confirm-title">{actionLabel}?</h2><p>We&apos;ll simulate this transaction first, then ask your connected wallet to sign it.</p><div className={styles.warning}><strong>This action cannot be undone.</strong><span>Verify the escrow, amount, and recipient before continuing.</span></div><div className={styles.modalActions}><button className={styles.secondaryAction} onClick={() => setPendingAction(null)}>Cancel</button><button className={styles.primaryAction} onClick={confirmAction}>Simulate &amp; continue</button></div></div></div>}
    </main>
  );
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <div className={styles.metric}><span className={`${styles.metricMark} ${styles[tone]}`} /><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div><span className={styles.metricArrow}>↗</span></div>; }
function Status({ status }: { status: EscrowStatus }) { return <span className={`${styles.status} ${styles[`status_${status}`]}`}><i />{statusLabels[status]}</span>; }
function StateRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div className={styles.stateRow}><span>{label}</span><strong className={mono ? styles.mono : ""}>{value}</strong></div>; }
function TimelineItem({ title, date, active = false }: { title: string; date: string; active?: boolean }) { return <div className={styles.timelineItem}><span className={`${styles.timelineDot} ${active ? styles.timelineActive : ""}`} /><div><strong>{title}</strong><small>{date}</small></div></div>; }
