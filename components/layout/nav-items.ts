import {
  BarChart3,
  Code2,
  CreditCard,
  LayoutDashboard,
  Lock,
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
  { label: "overview", href: "/overview", icon: LayoutDashboard },
  { label: "payments", href: "/payments", icon: CreditCard },
  { label: "refunds", href: "/refunds", icon: RotateCcw },
  { label: "escrow", href: "/escrow", icon: Lock },
  { label: "analytics", href: "/analytics", icon: BarChart3 },
  { label: "webhooks", href: "/webhooks", icon: Webhook },
  { label: "developers", href: "/developers", icon: Code2 },
  { label: "settings", href: "/settings", icon: Settings },
];

/** True when `pathname` is the nav item's route or one of its children. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
