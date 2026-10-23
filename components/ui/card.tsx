import * as React from "react";
import { cn } from "./utils";

export const Card = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(function Card(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={cn("rounded-lg border border-border bg-card text-foreground shadow-sm", className)} />;
});

export function CardHeader({
  className,
  title,
  subtitle,
  icon,
  action,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  if (title || subtitle || icon || action) {
    return (
      <div {...props} className={cn("flex items-start justify-between gap-4 p-5", className)}>
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-[#55C2FF]/10 text-[#0077B6]">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-foreground truncate">{title}</h2>}
            {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
        {children}
      </div>
    );
  }
  return <div {...props} className={cn("flex flex-col gap-1.5 p-5", className)}>{children}</div>;
}

export function CardTitle({ className, ...props }: React.ComponentPropsWithoutRef<"h3">) {
  return <h3 {...props} className={cn("font-heading text-lg font-semibold leading-tight", className)} />;
}

export function CardDescription({ className, ...props }: React.ComponentPropsWithoutRef<"p">) {
  return <p {...props} className={cn("text-sm text-muted", className)} />;
}

export function CardContent({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("px-5 pb-5", className)} />;
}

export function CardFooter({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("flex items-center gap-2 border-t border-border px-5 py-4", className)} />;
}

export function CardDivider({ className = "" }: { className?: string }) {
  return <hr className={cn("border-border", className)} />;
}

export function DetailRow({
  label,
  value,
  mono = false,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4", className)}>
      <dt className="text-sm text-muted sm:w-44 shrink-0">{label}</dt>
      <dd className={cn("text-sm text-foreground font-medium break-all", mono && "font-mono text-xs")}>
        {value}
      </dd>
    </div>
  );
}