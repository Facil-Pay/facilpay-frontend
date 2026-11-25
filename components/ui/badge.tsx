import * as React from "react";
import { cn } from "./utils";

export type BadgeStatus = "pending" | "completed" | "failed" | "refunded" | "expired";
export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";
export type BadgeSize = "sm" | "md";

// Every text/background pair below meets WCAG AA (4.5:1) in light and dark mode.
const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[#55C2FF]/10 text-[#00507a] border border-[#55C2FF]/30 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800",
  success: "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800",
  warning: "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800",
  danger:  "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-200 dark:border-red-800",
  info:    "bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800",
  neutral: "bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700",
};

const statusStyles: Record<BadgeStatus, string> = {
  pending: variantStyles.warning,
  completed: variantStyles.success,
  failed: variantStyles.danger,
  refunded: variantStyles.info,
  expired: variantStyles.neutral,
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-[#55C2FF]",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  info:    "bg-sky-500",
  neutral: "bg-zinc-400",
};

export type BadgeProps = React.ComponentPropsWithoutRef<"span"> & {
  status?: BadgeStatus;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
};

export function Badge({
  className,
  children,
  status,
  variant,
  size = "sm",
  dot = false,
  ...props
}: BadgeProps) {
  const chosenStyle = status
    ? statusStyles[status]
    : variant
    ? variantStyles[variant]
    : variantStyles.default;

  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full font-medium capitalize",
        size === "sm" ? "text-xs px-2.5 py-0.5 gap-1" : "text-sm px-3 py-1 gap-1.5",
        chosenStyle,
        className,
      )}
    >
      {dot && variant && (
        <span
          aria-hidden="true"
          className={cn(
            "shrink-0 rounded-full",
            dotColors[variant],
            size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
          )}
        />
      )}
      {children ?? status}
    </span>
  );
}