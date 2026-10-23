import type { Metadata } from "next";
import { Inter, Montserrat, Roboto_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${montserrat.variable} ${inter.variable} ${robotoMono.variable} antialiased`}>
        <NextIntlClientProvider locale="en" messages={messages}>
          <Providers>
            <WalletProviders>{children}</WalletProviders>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
