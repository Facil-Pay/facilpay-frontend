import type { Metadata } from "next";
import { Inter, Montserrat, Roboto_Mono } from "next/font/google";
import { Providers as WalletProviders } from "@/components/wallet/providers";
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

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${inter.variable} ${robotoMono.variable} antialiased`}>
        <Providers>
          <WalletProviders>{children}</WalletProviders>
        </Providers>
      </body>
    </html>
  );
}
