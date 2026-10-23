"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Archive, Ban, CalendarClock, Check, CircleAlert, Pause, Play, Plus, X } from "lucide-react";
import type { AssetType, BillingInterval, RecurringPlan, Subscription, SubscriptionStatus } from "@/lib/types";
import { billingIntervalLabel, INITIAL_RECURRING_PLANS, INITIAL_SUBSCRIPTIONS, nextBillingDate } from "@/lib/subscriptions";

type PageTab = "subscriptions" | "plans";
type CreateKind = "subscription" | "plan";

const statusOptions: { label: string; value: SubscriptionStatus | "ALL" }[] = [
  { label: "All statuses", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Past due", value: "PAST_DUE" },
  { label: "Paused", value: "PAUSED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const assetOptions: AssetType[] = ["USDC", "EURC", "XLM"];
const intervalOptions: BillingInterval[] = ["weekly", "monthly", "quarterly", "yearly"];

function money(amount: number, asset: AssetType) {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })} ${asset}`;
}

function dateLabel(value: string | null) {
  if (!value) return "No upcoming billing";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function statusStyle(status: SubscriptionStatus) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "PAST_DUE":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "PAUSED":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "CANCELLED":
      return "border-zinc-200 bg-zinc-100 text-zinc-600";
  }
}

function readableStatus(status: SubscriptionStatus) {
  return status === "PAST_DUE" ? "Past due" : status.charAt(0) + status.slice(1).toLowerCase();
}

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<PageTab>("subscriptions");
  const [plans, setPlans] = useState<RecurringPlan[]>(INITIAL_RECURRING_PLANS);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "ALL">("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [createKind, setCreateKind] = useState<CreateKind | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const [planAsset, setPlanAsset] = useState<AssetType>("USDC");
  const [planInterval, setPlanInterval] = useState<BillingInterval>("monthly");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [billingStart, setBillingStart] = useState("");

  const activePlans = plans.filter((plan) => plan.status === "ACTIVE");
  const activeCount = subscriptions.filter((subscription) => subscription.status === "ACTIVE").length;
  const pastDueCount = subscriptions.filter((subscription) => subscription.status === "PAST_DUE").length;
  const dueSoonCount = subscriptions.filter((subscription) => {
    if (subscription.status !== "ACTIVE" || !subscription.nextBillingAt) return false;
    const daysUntilBilling = (Date.parse(subscription.nextBillingAt) - Date.now()) / 86_400_000;
    return daysUntilBilling >= 0 && daysUntilBilling <= 7;
  }).length;

  const visibleSubscriptions = useMemo(() => subscriptions.filter((subscription) => {
    if (statusFilter !== "ALL" && subscription.status !== statusFilter) return false;
    if (planFilter !== "ALL" && subscription.planId !== planFilter) return false;
    const query = search.trim().toLowerCase();
    if (query && ![subscription.customerName, subscription.customerEmail, subscription.id]
      .some((value) => value.toLowerCase().includes(query))) return false;
    return true;
  }).sort((left, right) => {
    if (!left.nextBillingAt) return 1;
    if (!right.nextBillingAt) return -1;
    return left.nextBillingAt.localeCompare(right.nextBillingAt);
  }), [subscriptions, statusFilter, planFilter, search]);

  const visiblePlans = plans.filter((plan) => includeArchived || plan.status === "ACTIVE");

  const openCreate = (kind: CreateKind) => {
    setFormError(null);
    setCreateKind(kind);
    if (kind === "subscription") {
      setSelectedPlanId(activePlans[0]?.id ?? "");
      setBillingStart(new Date().toISOString().slice(0, 10));
    }
  };

  const closeCreate = () => {
    setCreateKind(null);
    setFormError(null);
    setPlanName("");
    setPlanDescription("");
    setPlanAmount("");
    setCustomerName("");
    setCustomerEmail("");
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (createKind === "plan") {
      const amount = Number(planAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setFormError("Enter an amount greater than zero.");
        return;
      }
      const plan: RecurringPlan = {
        id: `plan_${Date.now().toString(36)}`,
        name: planName.trim(),
        description: planDescription.trim(),
        amount,
        asset: planAsset,
        interval: planInterval,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };
      setPlans((current) => [plan, ...current]);
      setTab("plans");
      closeCreate();
      return;
    }

    const plan = plans.find((item) => item.id === selectedPlanId && item.status === "ACTIVE");
    if (!plan) {
      setFormError("Choose an active plan before creating a subscription.");
      return;
    }

    const start = new Date(`${billingStart}T12:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
      setFormError("Choose a valid first billing date.");
      return;
    }

    const subscription: Subscription = {
      id: `sub_${Date.now().toString(36)}`,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      planId: plan.id,
      amount: plan.amount,
      asset: plan.asset,
      interval: plan.interval,
      status: "ACTIVE",
      startedAt: start.toISOString(),
      nextBillingAt: nextBillingDate(start, plan.interval),
      lastPaymentStatus: null,
    };
    setSubscriptions((current) => [subscription, ...current]);
    setTab("subscriptions");
    closeCreate();
  };

  const handlePauseResume = (subscription: Subscription) => {
    if (subscription.status === "ACTIVE" || subscription.status === "PAST_DUE") {
      setSubscriptions((current) => current.map((item) => item.id === subscription.id
        ? { ...item, status: "PAUSED", nextBillingAt: null }
        : item));
      return;
    }
    if (subscription.status === "PAUSED") {
      setSubscriptions((current) => current.map((item) => item.id === subscription.id
        ? { ...item, status: "ACTIVE", nextBillingAt: nextBillingDate(new Date(), item.interval) }
        : item));
    }
  };

  const handleCancelSubscription = (id: string) => {
    setSubscriptions((current) => current.map((item) => item.id === id
      ? { ...item, status: "CANCELLED", nextBillingAt: null }
      : item));
  };

  const handleTogglePlan = (id: string) => {
    setPlans((current) => current.map((plan) => plan.id === id
      ? { ...plan, status: plan.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE" }
      : plan));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">Revenue</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Subscriptions</h1>
          <p className="mt-1 text-sm text-zinc-600">Manage recurring plans, customer billing, and upcoming renewals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === "plans" && (
            <button type="button" onClick={() => openCreate("plan")} className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50">
              <Plus className="h-4 w-4" aria-hidden="true" /> New plan
            </button>
          )}
          <button type="button" onClick={() => openCreate("subscription")} disabled={activePlans.length === 0} className="inline-flex items-center gap-2 rounded-md bg-[#000F24] px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-[#15304d] disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="h-4 w-4" aria-hidden="true" /> New subscription
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-zinc-200 pb-5 sm:grid-cols-4" aria-label="Subscription summary">
        <Summary label="Active subscriptions" value={String(activeCount)} icon={<Check className="h-4 w-4" />} tone="emerald" />
        <Summary label="Past due" value={String(pastDueCount)} icon={<CircleAlert className="h-4 w-4" />} tone={pastDueCount ? "rose" : "zinc"} />
        <Summary label="Renewing in 7 days" value={String(dueSoonCount)} icon={<CalendarClock className="h-4 w-4" />} tone="sky" />
        <Summary label="Active plans" value={String(activePlans.length)} icon={<RepeatIcon />} tone="zinc" />
      </section>

      <div className="flex gap-1 border-b border-zinc-200" role="tablist" aria-label="Subscription management views">
        <button type="button" role="tab" aria-selected={tab === "subscriptions"} onClick={() => setTab("subscriptions")} className={`border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === "subscriptions" ? "border-sky-600 text-sky-800" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}>
          Subscriptions <span className="ml-1 text-xs font-normal text-zinc-500">{subscriptions.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "plans"} onClick={() => setTab("plans")} className={`border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === "plans" ? "border-sky-600 text-sky-800" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}>
          Plans <span className="ml-1 text-xs font-normal text-zinc-500">{plans.length}</span>
        </button>
      </div>

      {tab === "subscriptions" ? (
        <section role="tabpanel" aria-label="Subscriptions" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(240px,1fr)_180px_220px]">
            <label>
              <span className="sr-only">Search subscriptions</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer or subscription ID" className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" />
            </label>
            <label>
              <span className="sr-only">Filter by status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as SubscriptionStatus | "ALL")} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800">
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by plan</span>
              <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800">
                <option value="ALL">All plans</option>
                {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}{plan.status === "ARCHIVED" ? " (archived)" : ""}</option>)}
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{visibleSubscriptions.length} subscriptions</span>
            <span>Amounts shown in each subscription’s billing asset</span>
          </div>

          <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Recurring amount</th>
                  <th className="px-4 py-3">Next bill</th>
                  <th className="px-4 py-3">Last payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {visibleSubscriptions.map((subscription) => {
                  const plan = plans.find((item) => item.id === subscription.planId);
                  return (
                    <tr key={subscription.id} className="hover:bg-zinc-50/70">
                      <td className="px-4 py-3">
                        <span className="block font-medium text-zinc-900">{subscription.customerName}</span>
                        <span className="block text-xs text-zinc-500">{subscription.customerEmail}</span>
                        <span className="mt-1 block font-mono text-[11px] text-zinc-400">{subscription.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-zinc-800">{plan?.name ?? "Deleted plan"}</span>
                        <span className="text-xs text-zinc-500">{billingIntervalLabel(subscription.interval)}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-zinc-900">{money(subscription.amount, subscription.asset)}<span className="ml-1 font-normal text-zinc-500">/ {subscription.interval === "weekly" ? "week" : subscription.interval === "monthly" ? "month" : subscription.interval === "quarterly" ? "quarter" : "year"}</span></td>
                      <td className="px-4 py-3 text-zinc-700">{dateLabel(subscription.nextBillingAt)}</td>
                      <td className="px-4 py-3">
                        {subscription.lastPaymentStatus ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${subscription.lastPaymentStatus === "FAILED" ? "text-rose-700" : subscription.lastPaymentStatus === "PAID" ? "text-emerald-700" : "text-amber-700"}`}>
                            {subscription.lastPaymentStatus === "FAILED" ? <CircleAlert className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                            {subscription.lastPaymentStatus === "PAID" ? "Paid" : subscription.lastPaymentStatus === "FAILED" ? "Failed" : "Processing"}
                          </span>
                        ) : <span className="text-xs text-zinc-400">No invoice yet</span>}
                      </td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(subscription.status)}`}>{readableStatus(subscription.status)}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {subscription.status !== "CANCELLED" && (
                            <button type="button" onClick={() => handlePauseResume(subscription)} aria-label={subscription.status === "PAUSED" ? `Resume ${subscription.customerName}'s subscription` : `Pause ${subscription.customerName}'s subscription`} title={subscription.status === "PAUSED" ? "Resume billing" : "Pause billing"} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
                              {subscription.status === "PAUSED" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                            </button>
                          )}
                          {subscription.status !== "CANCELLED" && (
                            <button type="button" onClick={() => handleCancelSubscription(subscription.id)} aria-label={`Cancel ${subscription.customerName}'s subscription`} title="Cancel subscription" className="rounded-md p-2 text-zinc-500 hover:bg-rose-50 hover:text-rose-700">
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visibleSubscriptions.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-500">No subscriptions match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section role="tabpanel" aria-label="Recurring plans" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">Reusable prices for scheduled customer billing.</p>
            <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
              <input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-sky-700 focus:ring-sky-600" />
              Include archived
            </label>
          </div>
          <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Billing interval</th>
                  <th className="px-4 py-3">Subscribers</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {visiblePlans.map((plan) => {
                  const subscriberCount = subscriptions.filter((subscription) => subscription.planId === plan.id && subscription.status !== "CANCELLED").length;
                  return (
                    <tr key={plan.id} className="hover:bg-zinc-50/70">
                      <td className="px-4 py-3"><span className="block font-semibold text-zinc-900">{plan.name}</span><span className="text-xs text-zinc-500">{plan.description || "No description"}</span></td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-zinc-900">{money(plan.amount, plan.asset)}</td>
                      <td className="px-4 py-3 text-zinc-700">{billingIntervalLabel(plan.interval)}</td>
                      <td className="px-4 py-3 tabular-nums text-zinc-700">{subscriberCount}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${plan.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-zinc-100 text-zinc-600"}`}>{plan.status === "ACTIVE" ? "Active" : "Archived"}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {plan.status === "ACTIVE" && <button type="button" onClick={() => { setTab("subscriptions"); setPlanFilter(plan.id); openCreate("subscription"); setSelectedPlanId(plan.id); }} aria-label={`Create subscription using ${plan.name}`} title="Create subscription" className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"><Plus className="h-4 w-4" /></button>}
                          <button type="button" onClick={() => handleTogglePlan(plan.id)} aria-label={`${plan.status === "ACTIVE" ? "Archive" : "Restore"} ${plan.name} plan`} title={plan.status === "ACTIVE" ? "Archive plan" : "Restore plan"} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"><Archive className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visiblePlans.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">No active plans. Create a plan to start billing customers.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {createKind && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreate(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="subscription-dialog-title" className="my-auto w-full max-w-lg rounded-lg border border-zinc-200 bg-white shadow-xl">
            <header className="flex items-start justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <h2 id="subscription-dialog-title" className="text-lg font-semibold text-zinc-950">{createKind === "plan" ? "Create recurring plan" : "New subscription"}</h2>
                <p className="mt-1 text-sm text-zinc-600">{createKind === "plan" ? "Set a reusable price and billing cadence." : "Choose a plan and customer for scheduled billing."}</p>
              </div>
              <button type="button" onClick={closeCreate} aria-label="Close dialog" className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100"><X className="h-5 w-5" /></button>
            </header>
            <form onSubmit={handleCreate} className="space-y-4 p-5">
              {formError && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{formError}</p>}
              {createKind === "plan" ? (
                <>
                  <Field label="Plan name"><input required maxLength={80} value={planName} onChange={(event) => setPlanName(event.target.value)} placeholder="e.g. Pro monthly" className={inputClass} /></Field>
                  <Field label="Description"><input maxLength={160} value={planDescription} onChange={(event) => setPlanDescription(event.target.value)} placeholder="What is included in this plan?" className={inputClass} /></Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Amount"><input required type="number" min="0.0000001" step="any" value={planAmount} onChange={(event) => setPlanAmount(event.target.value)} placeholder="0.00" className={inputClass} /></Field>
                    <Field label="Asset"><select value={planAsset} onChange={(event) => setPlanAsset(event.target.value as AssetType)} className={inputClass}>{assetOptions.map((asset) => <option key={asset}>{asset}</option>)}</select></Field>
                  </div>
                  <Field label="Billing interval"><select value={planInterval} onChange={(event) => setPlanInterval(event.target.value as BillingInterval)} className={inputClass}>{intervalOptions.map((interval) => <option key={interval} value={interval}>{billingIntervalLabel(interval)}</option>)}</select></Field>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Customer name"><input required maxLength={120} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Full name" className={inputClass} /></Field>
                    <Field label="Customer email"><input required type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="name@company.com" className={inputClass} /></Field>
                  </div>
                  <Field label="Plan"><select required value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)} className={inputClass}><option value="" disabled>Select a plan</option>{activePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {money(plan.amount, plan.asset)} · {billingIntervalLabel(plan.interval)}</option>)}</select></Field>
                  <Field label="Subscription start date"><input required type="date" value={billingStart} onChange={(event) => setBillingStart(event.target.value)} className={inputClass} /></Field>
                </>
              )}
              <footer className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
                <button type="button" onClick={closeCreate} className="rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Cancel</button>
                <button type="submit" className="rounded-md bg-[#000F24] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#15304d]">{createKind === "plan" ? "Create plan" : "Create subscription"}</button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

const inputClass = "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium text-zinc-700">{label}{children}</label>;
}

function Summary({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: "emerald" | "rose" | "sky" | "zinc" }) {
  const toneClass = { emerald: "text-emerald-800", rose: "text-rose-800", sky: "text-sky-800", zinc: "text-zinc-900" }[tone];
  return <div><p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">{icon}{label}</p><p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p></div>;
}

function RepeatIcon() {
  return <CalendarClock className="h-4 w-4" />;
}