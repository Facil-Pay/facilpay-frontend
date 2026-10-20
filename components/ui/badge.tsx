import * as React from "react";
import { cn } from "./utils";

export type BadgeStatus = "pending" | "completed" | "failed" | "refunded" | "expired";

const statusStyles: Record<BadgeStatus, string> = {
  pending: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  failed: "bg-danger/10 text-danger",
  refunded: "bg-info/10 text-info",
  expired: "bg-muted/10 text-muted",
};

// Legacy variant-based API (used by app/components/)
export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";
export type BadgeSize = "sm" | "md";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[#55C2FF]/10 text-[#0077B6] border border-[#55C2FF]/30",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
  info: "bg-sky-50 text-sky-700 border border-sky-200",
  neutral: "bg-zinc-100 text-zinc-600 border border-zinc-200",
};

const dotClasses: Record<BadgeVariant, string> = {
  default: "bg-[#55C2FF]",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  neutral: "bg-zinc-400",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
};

export type BadgeProps = React.ComponentPropsWithoutRef<"span"> & (
  | { status: BadgeStatus; variant?: never; size?: never; dot?: never }
  | { variant: BadgeVariant; size?: BadgeSize; dot?: boolean; status?: never }
);

export function Badge({ className, children, status, variant, size = "sm", dot = false, ...props }: BadgeProps) {
  if (variant) {
    return (
      <span
        {...props}
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
      >
        {dot && (
          <span
            className={cn(
              "shrink-0 rounded-full",
              dotClasses[variant],
              size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
            )}
          />
        )}
        {children}
      </span>
    );
  }

  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        status ? statusStyles[status] : "",
        className,
      )}
    >
      {children ?? status}
    </span>
  );
}