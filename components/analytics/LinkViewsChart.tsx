"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LinkAnalyticsPoint } from "@/lib/types/analytics";

const palette = {
  primary: "#20a7ee",
  success: "#16a34a",
};

/** Views vs. completed payments over time for one payment link (Issue #134). */
export default function LinkViewsChart({ data }: { data: LinkAnalyticsPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} />
        <YAxis tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Line type="monotone" dataKey="views" name="Views" stroke={palette.primary} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="completedPayments" name="Completed" stroke={palette.success} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
