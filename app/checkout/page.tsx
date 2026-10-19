import Link from "next/link";
import { Sep7PaymentQR } from "@/components/stellar/sep7-payment-qr";
import { INITIAL_PLANS } from "@/lib/subscriptions";

const merchantAddress = "GBT5PBINLNRI5RJPJBOPSMODBGIHALJQJ2ISTANRF54BGM2WVIBECCNB";

export const metadata = {
  title: "Checkout | FacilPay",
};

interface CheckoutProps {
  searchParams?: Promise<{ planId?: string }> | { planId?: string };
}

export default async function HostedCheckoutPage({ searchParams }: CheckoutProps) {
  const resolved = searchParams ? await searchParams : {};
  const planId = resolved?.planId;
  const plan = planId ? INITIAL_PLANS.find((p) => p.id === planId) : null;

  return (
    <main className="stellar-page">
      <header className="stellar-header">
        <Link className="stellar-brand" href="/" aria-label="FacilPay home">
          <span>f</span> facilpay<span className="stellar-period">.</span>
        </Link>
        <span className="stellar-secure">
          <i /> SECURE CHECKOUT
        </span>
      </header>
      <div className="checkout-layout">
        <section className="checkout-order">
          <span className="stellar-kicker">
            {plan ? "RECURRING SUBSCRIPTION" : "NORTHSTAR GOODS"}
          </span>
          <h1>{plan ? `Subscribe to ${plan.name}` : "Complete your payment"}</h1>
          <p className="stellar-subtitle">
            {plan
              ? `Authorize ${plan.interval} billing on the Stellar network.`
              : "Scan with a Stellar wallet to pay securely."}
          </p>
          <div className="checkout-total">
            <span>{plan ? `${plan.interval.toUpperCase()} PLAN` : "Order total"}</span>
            <strong>
              {plan ? plan.amount.toFixed(2) : "25.00"} <small>{plan ? plan.asset : "XLM"}</small>
              {plan && <span className="text-xs font-normal text-zinc-500"> / {plan.interval}</span>}
            </strong>
          </div>
          {plan && plan.trialDays > 0 && (
            <div className="checkout-reference">
              <span>Trial Period</span>
              <b className="text-emerald-600">{plan.trialDays} days free trial included</b>
            </div>
          )}
          <div className="checkout-reference">
            <span>{plan ? "Plan Reference" : "Order"}</span>
            <b>{plan ? `SUB-${plan.id.slice(0, 10).toUpperCase()}` : "INV-1042"}</b>
          </div>
          <div className="checkout-reference">
            <span>Pay to</span>
            <b>Northstar Goods</b>
          </div>
          <div className="checkout-divider" />
          <p className="checkout-footnote">
            {plan
              ? "Your wallet will establish a pre-authorized recurring payment authorization. You can pause or cancel at any time."
              : "Your wallet will show the recipient and amount before you confirm."}
          </p>
        </section>
        <section className="checkout-scan">
          <div className="scan-heading">
            <span>PAY WITH WALLET</span>
            <h2>{plan ? "Authorize Plan" : "Scan to pay"}</h2>
            <p>Open a Stellar wallet on your phone and scan this code.</p>
          </div>
          <Sep7PaymentQR
            destination={merchantAddress}
            amount={plan ? (plan.trialDays > 0 ? "0.01" : plan.amount.toFixed(2)) : "25.00"}
            asset="native"
            memo={plan ? `SUB-${plan.id.slice(0, 8)}` : "INV-1042"}
            memoType="text"
            message={plan ? `Subscribe: ${plan.name}` : "Order 1042"}
            size={252}
          />
          <div className="network-label">
            <i /> Stellar network
          </div>
        </section>
      </div>
      <footer className="stellar-footer">
        Payments powered by <b>facilpay.</b>
      </footer>
    </main>
  );
}