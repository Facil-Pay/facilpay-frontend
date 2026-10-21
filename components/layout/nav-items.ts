import {
  BarChart3,
  ArrowLeftRight,
  Code2,
  CreditCard,
  LayoutDashboard,
  Lock,
  Repeat2,
  RotateCcw,
  Settings,
  Webhook,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Subscriptions", href: "/subscriptions", icon: Repeat2 },
  { label: "Refunds", href: "/refunds", icon: RotateCcw },
  { label: "Escrow", href: "/escrow", icon: Lock },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Reconciliation", href: "/reconciliation", icon: ArrowLeftRight },
  { label: "Webhooks", href: "/webhooks", icon: Webhook },
  { label: "Developers", href: "/developers", icon: Code2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

/** True when `pathname` is the nav item's route or one of its children. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
