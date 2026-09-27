import { type ReactNode } from "react";

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Removes default padding */
  noPadding?: boolean;
}

export function Card({ children, className = "", noPadding = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-zinc-200 shadow-sm ${noPadding ? "" : "p-6"} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Card Header ──────────────────────────────────────────────────────────────

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className = "",
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-[#55C2FF]/10 text-[#0077B6]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-zinc-900 truncate">{title}</h2>
          {subtitle && (
            <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Card Divider ─────────────────────────────────────────────────────────────

export function CardDivider({ className = "" }: { className?: string }) {
  return <hr className={`border-zinc-100 ${className}`} />;
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

interface DetailRowProps {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}

export function DetailRow({ label, value, mono = false, className = "" }: DetailRowProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 ${className}`}>
      <dt className="text-sm text-zinc-500 sm:w-44 shrink-0">{label}</dt>
      <dd className={`text-sm text-zinc-900 font-medium break-all ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
