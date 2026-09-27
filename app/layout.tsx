import type { Metadata } from "next";
import { Inter, Montserrat, Roboto_Mono } from "next/font/google";
import { Providers } from "@/components/wallet/providers";
import "./globals.css";
import { Providers } from "@/app/providers";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "FacilPay | Merchant Dashboard",
  description: "Manage payments and issue refunds with FacilPay.",
};

// ─── Top navigation ───────────────────────────────────────────────────────────

function TopNav() {
  return (
    <header className="bg-[#000F24] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
        {/* Logo wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55C2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#000F24] rounded"
          aria-label="FacilPay home"
        >
          {/* Icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="8" fill="#55C2FF" />
            <path
              d="M8 10h10a6 6 0 010 12H8V10z"
              fill="#000F24"
            />
            <circle cx="22" cy="22" r="3" fill="#000F24" />
          </svg>
          <span className="text-base font-bold tracking-tight">FacilPay</span>
        </Link>

        {/* Nav links */}
        <nav aria-label="Primary navigation">
          <ul className="flex items-center gap-1">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/payments",  label: "Payments"  },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex items-center h-8 px-3 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side — avatar placeholder */}
        <div
          className="h-8 w-8 rounded-full bg-[#55C2FF]/20 border border-[#55C2FF]/40 flex items-center justify-center shrink-0 select-none"
          aria-label="User account"
          role="img"
        >
          <span className="text-xs font-bold text-[#55C2FF]">M</span>
        </div>
      </div>
    </header>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${inter.variable} ${robotoMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
