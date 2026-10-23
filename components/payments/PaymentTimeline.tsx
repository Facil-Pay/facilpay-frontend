import type { TimelineEvent, TimelineEventType, PaymentStatus } from "@/app/lib/types/payment";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

// ─── Icon map ─────────────────────────────────────────────────────────────────

function EventIcon({ type }: { type: TimelineEventType }) {
  const base = "h-4 w-4";

  switch (type) {
    case "created":
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
        </svg>
      );
    case "processing":
      return (
        <svg className={`${base} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      );
    case "broadcast":
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M16.707 3.293a1 1 0 010 1.414L5.414 16H9a1 1 0 110 2H3a1 1 0 01-1-1v-6a1 1 0 112 0v3.586L15.293 3.293a1 1 0 011.414 0z" />
        </svg>
      );
    case "confirmed":
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      );
    case "completed":
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      );
    case "failed":
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    case "refund_initiated":
    case "refunded":
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10a.75.75 0 010-1.5h3.625a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.061.025z" clipRule="evenodd" />
        </svg>
      );
    case "cancelled":
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
      );
  }
}

// ─── Node colour ──────────────────────────────────────────────────────────────

function nodeStyle(status: PaymentStatus): string {
  switch (status) {
    case "completed":  return "bg-emerald-500 text-white ring-emerald-100";
    case "processing": return "bg-[#55C2FF] text-[#000F24] ring-[#55C2FF]/20";
    case "failed":     return "bg-red-500 text-white ring-red-100";
    case "refunded":   return "bg-zinc-400 text-white ring-zinc-100";
    case "cancelled":  return "bg-zinc-400 text-white ring-zinc-100";
    default:           return "bg-amber-400 text-white ring-amber-100";
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }),
  };
}

// ─── Single event node ────────────────────────────────────────────────────────

interface TimelineNodeProps {
  event: TimelineEvent;
  isLast: boolean;
}

function TimelineNode({ event, isLast }: TimelineNodeProps) {
  const { date, time } = formatTimestamp(event.timestamp);
  const colour = nodeStyle(event.status);

  return (
    <li className="relative flex gap-4">
      {/* Vertical connector line */}
      {!isLast && (
        <div
          aria-hidden="true"
          className="absolute left-[17px] top-10 bottom-0 w-px bg-zinc-200"
        />
      )}

      {/* Icon node */}
      <div
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ${colour}`}
      >
        <EventIcon type={event.type} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900">{event.title}</span>
          <PaymentStatusBadge status={event.status} size="sm" dot={false} />
        </div>

        <p className="mt-1 text-sm text-zinc-600 leading-relaxed">
          {event.description}
        </p>

        {/* Metadata pills */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <dl className="mt-2 flex flex-wrap gap-2">
            {Object.entries(event.metadata).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center gap-1 rounded-md bg-zinc-50 border border-zinc-200 px-2 py-0.5"
              >
                <dt className="text-xs text-zinc-500 capitalize">{key}:</dt>
                <dd className="text-xs font-mono font-medium text-zinc-800">
                  {String(val)}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* Timestamp + actor */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <time
            dateTime={event.timestamp}
            className="text-xs text-zinc-400 tabular-nums"
          >
            {date} · {time}
          </time>
          {event.actor && (
            <span className="text-xs text-zinc-400">
              by{" "}
              <span className="text-zinc-600 font-medium">{event.actor}</span>
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

interface PaymentTimelineProps {
  events: TimelineEvent[];
}

export function PaymentTimeline({ events }: PaymentTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-4">
        No timeline events recorded for this payment.
      </p>
    );
  }

  // Newest first
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <ol aria-label="Payment lifecycle timeline" className="space-y-0">
      {sorted.map((event, idx) => (
        <TimelineNode
          key={event.id}
          event={event}
          isLast={idx === sorted.length - 1}
        />
      ))}
    </ol>
  );
}
