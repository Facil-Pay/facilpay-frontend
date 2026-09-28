import type { TopCustomer } from "@/lib/types/analytics";
import { InsightCard, InsightEmpty, usd } from "./InsightCard";

function displayIdentifier(customer: TopCustomer): string {
  if (customer.email) return customer.email;
  const id = customer.identifier;
  return id.length > 20 ? `${id.slice(0, 6)}…${id.slice(-6)}` : id;
}

export function TopCustomers({ customers }: { customers: TopCustomer[] }) {
  const top10 = [...customers].sort((a, b) => b.total - a.total).slice(0, 10);

  return (
    <InsightCard title="Top customers" subtitle="Top 10 by volume" className="lg:col-span-2">
      {top10.length === 0 ? (
        <InsightEmpty />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="py-2 pr-3 font-medium">#</th>
                <th scope="col" className="py-2 pr-3 font-medium">Customer</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Payments</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Total</th>
                <th scope="col" className="py-2 text-right font-medium">Last payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {top10.map((customer, index) => (
                <tr key={customer.identifier}>
                  <td className="py-2 pr-3 text-zinc-400">{index + 1}</td>
                  <td className="py-2 pr-3">
                    <span
                      title={customer.identifier}
                      className={customer.email ? "text-zinc-900" : "font-mono text-xs text-zinc-900"}
                    >
                      {displayIdentifier(customer)}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right text-zinc-700">{customer.paymentCount.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right font-medium text-zinc-900">{usd.format(customer.total)}</td>
                  <td className="py-2 text-right text-zinc-600">
                    {new Date(customer.lastPaymentAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </InsightCard>
  );
}
